interface VoteMessage {
  pollId: string;
  optionId: string;
  userId: string;
  timestamp: number;
}

interface Env {
  DB: D1Database;
  POLL_ROOM: DurableObjectNamespace;
}

export async function voteQueueConsumer(
  batch: MessageBatch<VoteMessage>,
  env: Env
): Promise<void> {
  // Group votes by poll ID for efficient processing
  const votesByPoll = new Map<string, VoteMessage[]>();
  
  for (const message of batch.messages) {
    const vote = message.body;
    if (!votesByPoll.has(vote.pollId)) {
      votesByPoll.set(vote.pollId, []);
    }
    votesByPoll.get(vote.pollId)!.push(vote);
  }

  // Process votes for each poll
  for (const [pollId, votes] of votesByPoll) {
    try {
      // Batch insert votes into database
      await processVotesForPoll(pollId, votes, env);
      
      // Update tallies in PollRoom
      await updatePollTallies(pollId, votes, env);
      
      // Acknowledge messages
      for (const message of batch.messages) {
        if (message.body.pollId === pollId) {
          message.ack();
        }
      }
    } catch (error) {
      console.error(`Error processing votes for poll ${pollId}:`, error);
      
      // Retry messages on error
      for (const message of batch.messages) {
        if (message.body.pollId === pollId) {
          message.retry();
        }
      }
    }
  }
}

async function processVotesForPoll(
  pollId: string,
  votes: VoteMessage[],
  env: Env
): Promise<void> {
  // Check if poll exists
  const pollResult = await env.DB.prepare(
    'SELECT id FROM polls WHERE id = ?'
  ).bind(pollId).first();

  if (!pollResult) {
    throw new Error(`Poll ${pollId} not found`);
  }

  // Process each vote
  const statements = [];
  const processedVotes = new Map<string, VoteMessage>();

  for (const vote of votes) {
    // Only keep the latest vote per user
    const key = `${vote.pollId}-${vote.userId}`;
    const existing = processedVotes.get(key);
    
    if (!existing || existing.timestamp < vote.timestamp) {
      processedVotes.set(key, vote);
    }
  }

  // Insert or update votes
  for (const vote of processedVotes.values()) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO votes (poll_id, option_id, user_id, created_at) 
         VALUES (?, ?, ?, ?)
         ON CONFLICT(poll_id, user_id) 
         DO UPDATE SET option_id = excluded.option_id, created_at = excluded.created_at`
      ).bind(
        vote.pollId,
        vote.optionId,
        vote.userId,
        Math.floor(vote.timestamp / 1000)
      )
    );
  }

  // Execute all statements in a batch
  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
}

async function updatePollTallies(
  pollId: string,
  votes: VoteMessage[],
  env: Env
): Promise<void> {
  // Get current tallies from database
  const tallyResult = await env.DB.prepare(
    `SELECT option_id, COUNT(*) as vote_count 
     FROM votes 
     WHERE poll_id = ? 
     GROUP BY option_id`
  ).bind(pollId).all();

  // Convert to tally map
  const tallies: Record<string, number> = {};
  for (const row of tallyResult.results as any[]) {
    tallies[row.option_id] = row.vote_count;
  }

  // Update PollRoom with new tallies
  const pollRoomId = env.POLL_ROOM.idFromName('current');
  const pollStub = env.POLL_ROOM.get(pollRoomId);

  // Calculate increments (simplified - in production, track previous state)
  for (const vote of votes) {
    await pollStub.fetch('http://internal/updateTally', {
      method: 'POST',
      body: JSON.stringify({
        pollId: vote.pollId,
        optionId: vote.optionId,
        increment: 1
      })
    });
  }
}