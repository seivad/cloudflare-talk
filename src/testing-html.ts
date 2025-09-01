export const TESTING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testing Tools - CloudFlare Tech Talk</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 2rem;
        }
        .back-link {
            display: inline-block;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            margin-bottom: 20px;
            transition: background 0.3s;
        }
        .back-link:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .feature-card h2 {
            margin-top: 0;
            font-size: 1.5rem;
            color: #ffd700;
        }
        button {
            display: inline-block;
            margin: 5px;
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        input {
            width: calc(100% - 16px);
            padding: 8px;
            margin: 5px 0;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border-radius: 4px;
        }
        input::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        .status {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
            font-family: monospace;
            font-size: 12px;
        }
        .participants-display {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            max-height: 200px;
            overflow-y: auto;
        }
        .participant-item {
            padding: 5px;
            margin: 2px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        .keyboard-info {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            max-width: 300px;
        }
        .keyboard-info h3 {
            margin-top: 0;
            color: #ffd700;
        }
        .keyboard-info code {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 6px;
            border-radius: 3px;
        }
        .greeting-position {
            position: fixed;
            bottom: 70px;
            left: 120px;
            background: rgba(255, 0, 0, 0.2);
            padding: 10px;
            border: 2px dashed rgba(255, 255, 255, 0.5);
            border-radius: 10px;
            font-size: 12px;
        }
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
                transform: translateY(10px);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/presenter" class="back-link">← Back to Presenter Dashboard</a>
        <h1>🚀 Testing Tools</h1>
        
        <div class="features-grid">
            <div class="feature-card">
                <h2>👤 Participant Management</h2>
                <input type="text" id="firstName" placeholder="First Name">
                <input type="text" id="lastName" placeholder="Last Name">
                <div>
                    <button onclick="joinAsParticipant()">Join Session</button>
                    <button onclick="loadFromCookies()">Load Saved</button>
                    <button onclick="clearCookies()">Clear Cookies</button>
                </div>
                <div class="status" id="cookieStatus">No participant data</div>
            </div>
            
            <div class="feature-card">
                <h2>👥 Audience Simulator</h2>
                <button onclick="addRandomParticipants(5)">Add 5 Random</button>
                <button onclick="addRandomParticipants(10)">Add 10 Random</button>
                <button onclick="addRandomParticipants(25)">Add 25 Random</button>
                <button onclick="clearAllParticipants()">Clear All</button>
                <div class="participants-display" id="participantsList">
                    <div style="color: rgba(255,255,255,0.6);">No participants yet</div>
                </div>
            </div>
            
            <div class="feature-card">
                <h2>🎉 Greeting System</h2>
                <button onclick="testSingleGreeting()">Test Single</button>
                <button onclick="testMultipleGreetings()">Test Queue (3)</button>
                <button onclick="testRapidGreetings()">Rapid Join (5)</button>
                <div class="status" id="greetingStatus">Ready to test greetings</div>
            </div>
            
            <div class="feature-card">
                <h2>🔍 Profanity Filter</h2>
                <input type="text" id="profanityInput" placeholder="Enter text to filter">
                <button onclick="testProfanityFilter()">Test Filter</button>
                <div class="status" id="filterStatus">Enter text above to test</div>
            </div>
        </div>
        
        <div class="greeting-position">
            Greetings appear here →
        </div>
        
        <div class="keyboard-info">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <p><code>A</code> - Show audience list</p>
            <p><code>W</code> - Pick prize winner</p>
            <p><code>ESC</code> - Close overlays</p>
        </div>
    </div>
    
    <script>
        // Participant tracking
        const connectedParticipants = new Map();
        const greetingQueue = [];
        let isShowingGreeting = false;
        
        // Test names database
        const testNames = [
            { firstName: 'Mick', lastName: 'Davies' },
            { firstName: 'Steven', lastName: 'Williams' },
            { firstName: 'Hayley', lastName: 'Davis' },
            { firstName: 'Sarah', lastName: 'Johnson' },
            { firstName: 'Alex', lastName: 'Chen' },
            { firstName: 'Emma', lastName: 'Thompson' },
            { firstName: 'Jack', lastName: 'Brown' },
            { firstName: 'Lisa', lastName: 'Martinez' },
            { firstName: 'David', lastName: 'Anderson' },
            { firstName: 'Sophie', lastName: 'Wilson' },
            { firstName: 'Michael', lastName: 'Taylor' },
            { firstName: 'Jessica', lastName: 'Moore' },
            { firstName: 'Ryan', lastName: 'Garcia' },
            { firstName: 'Olivia', lastName: 'Rodriguez' },
            { firstName: 'Daniel', lastName: 'Lee' },
            { firstName: 'Isabella', lastName: 'Harris' },
            { firstName: 'James', lastName: 'Clark' },
            { firstName: 'Emily', lastName: 'Lewis' },
            { firstName: 'Andrew', lastName: 'Walker' },
            { firstName: 'Ava', lastName: 'Hall' }
        ];
        
        const greetingMessages = [
            'Hey {name}!',
            'Welcome {name}!',
            'What\\'s up {name}',
            'Hello {name}!',
            'Good to see you {name}',
            'Glad you\\'re here {name}',
            'Thanks for joining {name}',
            'Greetings {name}!',
            'Hi there {name}',
            'Welcome aboard {name}'
        ];
        
        // Cookie functions
        function getCookie(name) {
            const value = '; ' + document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }
        
        function setCookie(name, value, days = 365) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = 'expires=' + date.toUTCString();
            document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax';
        }
        
        // Profanity filter
        function filterProfanity(text) {
            const profanityList = [
                'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'piss', 
                'dick', 'cock', 'pussy', 'bastard', 'slut', 'whore', 'fag', 
                'cunt', 'nigger', 'nigga', 'retard', 'gay', 'homo'
            ];
            
            let filtered = text;
            const specialChars = ['$', '@', '#', '%', '&', '*', '!', '^'];
            
            profanityList.forEach(word => {
                const regex = new RegExp(word, 'gi');
                filtered = filtered.replace(regex, (match) => {
                    return match.split('').map(() => 
                        specialChars[Math.floor(Math.random() * specialChars.length)]
                    ).join('');
                });
            });
            
            return filtered;
        }
        
        // Participant functions
        function joinAsParticipant() {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            
            if (!firstName) {
                alert('Please enter at least a first name');
                return;
            }
            
            const filteredFirst = filterProfanity(firstName);
            const filteredLast = filterProfanity(lastName);
            
            setCookie('participant_firstName', filteredFirst);
            setCookie('participant_lastName', filteredLast);
            
            const participantId = 'manual_' + Date.now();
            connectedParticipants.set(participantId, {
                firstName: filteredFirst,
                lastName: filteredLast,
                lastInitial: filteredLast ? filteredLast.charAt(0) : '',
                joinedAt: Date.now()
            });
            
            showWelcomeGreeting({
                firstName: filteredFirst,
                lastInitial: filteredLast ? filteredLast.charAt(0) : ''
            });
            
            updateParticipantsList();
            document.getElementById('cookieStatus').textContent = 
                'Joined as: ' + filteredFirst + ' ' + (filteredLast ? filteredLast.charAt(0) + '.' : '');
        }
        
        function loadFromCookies() {
            const firstName = getCookie('participant_firstName');
            const lastName = getCookie('participant_lastName');
            
            if (firstName) {
                document.getElementById('firstName').value = firstName;
                document.getElementById('lastName').value = lastName || '';
                document.getElementById('cookieStatus').textContent = 
                    'Loaded: ' + firstName + ' ' + (lastName || '');
            } else {
                document.getElementById('cookieStatus').textContent = 'No saved data found';
            }
        }
        
        function clearCookies() {
            setCookie('participant_firstName', '', -1);
            setCookie('participant_lastName', '', -1);
            document.getElementById('cookieStatus').textContent = 'Cookies cleared';
            document.getElementById('firstName').value = '';
            document.getElementById('lastName').value = '';
        }
        
        function addRandomParticipants(count) {
            for (let i = 0; i < count; i++) {
                const randomName = testNames[Math.floor(Math.random() * testNames.length)];
                const participantId = 'test_' + Date.now() + '_' + Math.random();
                
                connectedParticipants.set(participantId, {
                    firstName: randomName.firstName,
                    lastName: randomName.lastName,
                    lastInitial: randomName.lastName.charAt(0),
                    joinedAt: Date.now()
                });
                
                // Show greeting with slight delay between each
                setTimeout(() => {
                    showWelcomeGreeting({
                        firstName: randomName.firstName,
                        lastInitial: randomName.lastName.charAt(0)
                    });
                }, i * 100);
            }
            
            updateParticipantsList();
        }
        
        function clearAllParticipants() {
            connectedParticipants.clear();
            updateParticipantsList();
        }
        
        function updateParticipantsList() {
            const listDiv = document.getElementById('participantsList');
            
            if (connectedParticipants.size === 0) {
                listDiv.innerHTML = '<div style="color: rgba(255,255,255,0.6);">No participants yet</div>';
                return;
            }
            
            const participants = Array.from(connectedParticipants.values())
                .sort((a, b) => a.firstName.localeCompare(b.firstName));
            
            let html = '';
            participants.forEach((p, index) => {
                const name = p.lastInitial ? 
                    p.firstName + ' ' + p.lastInitial + '.' : p.firstName;
                html += '<div class="participant-item">' + (index + 1) + '. ' + name + '</div>';
            });
            
            listDiv.innerHTML = html;
        }
        
        // Greeting system
        function getRandomGreeting(firstName, lastInitial) {
            const greeting = greetingMessages[Math.floor(Math.random() * greetingMessages.length)];
            const name = lastInitial ? firstName + ' ' + lastInitial + '.' : firstName;
            return greeting.replace('{name}', name);
        }
        
        function showWelcomeGreeting(participant) {
            greetingQueue.push(participant);
            
            if (!isShowingGreeting) {
                processGreetingQueue();
            }
        }
        
        function processGreetingQueue() {
            if (greetingQueue.length === 0) {
                isShowingGreeting = false;
                document.getElementById('greetingStatus').textContent = 'Greeting queue empty';
                return;
            }
            
            isShowingGreeting = true;
            const participant = greetingQueue.shift();
            document.getElementById('greetingStatus').textContent = 
                'Showing: ' + participant.firstName + ' (' + greetingQueue.length + ' in queue)';
            
            const greetingDiv = document.createElement('div');
            greetingDiv.style.cssText = 
                'position: fixed;' +
                'bottom: 70px;' +
                'left: 120px;' +
                'background: rgba(0, 0, 0, 0.8);' +
                'color: white;' +
                'padding: 12px 20px;' +
                'border-radius: 25px;' +
                'font-size: 18px;' +
                'font-weight: 500;' +
                'z-index: 1000;' +
                'backdrop-filter: blur(10px);' +
                'animation: slideInLeft 0.5s ease-out;' +
                'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);';
            
            greetingDiv.textContent = getRandomGreeting(participant.firstName, participant.lastInitial);
            document.body.appendChild(greetingDiv);
            
            setTimeout(() => {
                greetingDiv.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => {
                    greetingDiv.remove();
                    setTimeout(() => processGreetingQueue(), 200);
                }, 500);
            }, 2500);
        }
        
        function testSingleGreeting() {
            const randomName = testNames[Math.floor(Math.random() * testNames.length)];
            showWelcomeGreeting({
                firstName: randomName.firstName,
                lastInitial: randomName.lastName.charAt(0)
            });
        }
        
        function testMultipleGreetings() {
            for (let i = 0; i < 3; i++) {
                const randomName = testNames[Math.floor(Math.random() * testNames.length)];
                showWelcomeGreeting({
                    firstName: randomName.firstName,
                    lastInitial: randomName.lastName.charAt(0)
                });
            }
        }
        
        function testRapidGreetings() {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
                    showWelcomeGreeting({
                        firstName: randomName.firstName,
                        lastInitial: randomName.lastName.charAt(0)
                    });
                }, i * 300);
            }
        }
        
        // Profanity filter test
        function testProfanityFilter() {
            const input = document.getElementById('profanityInput').value;
            const filtered = filterProfanity(input);
            document.getElementById('filterStatus').innerHTML = 
                'Original: ' + input + '<br>Filtered: ' + filtered;
        }
        
        // Audience list overlay
        function showAudienceList() {
            let overlay = document.getElementById('audienceListOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'audienceListOverlay';
                overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: none; z-index: 9999; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);';
                document.body.appendChild(overlay);
            }
            
            // Deduplicate participants by name
            const participantsMap = new Map();
            Array.from(connectedParticipants.values()).forEach(participant => {
                const key = participant.firstName + '_' + (participant.lastInitial || '');
                // Keep the first occurrence of each unique name
                if (!participantsMap.has(key)) {
                    participantsMap.set(key, participant);
                }
            });
            
            const participants = Array.from(participantsMap.values()).sort((a, b) => {
                return a.firstName.localeCompare(b.firstName);
            });
            
            let listHTML = '<div style="padding: 3rem; height: 100%; display: flex; flex-direction: column;">';
            listHTML += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">';
            listHTML += '<h1 style="font-size: 3rem; color: white; margin: 0;">👥 Audience Members (' + participants.length + ')</h1>';
            listHTML += '<div style="font-size: 1.2rem; color: #ccc;">Press ESC to close</div>';
            listHTML += '</div>';
            
            listHTML += '<div style="flex: 1; overflow-y: auto; background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 2rem;">';
            
            if (participants.length === 0) {
                listHTML += '<div style="text-align: center; color: #999; font-size: 1.5rem; padding: 3rem;">No participants have joined yet</div>';
            } else {
                listHTML += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; max-width: 1200px; margin: 0 auto;">';
                
                participants.forEach((participant, index) => {
                    const fullName = participant.lastInitial ? 
                        participant.firstName + ' ' + participant.lastInitial + '.' : 
                        participant.firstName;
                    
                    listHTML += '<div style="background: rgba(255, 255, 255, 0.1); padding: 1rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 1rem;">';
                    listHTML += '<div style="font-size: 1.5rem; opacity: 0.5;">' + (index + 1) + '.</div>';
                    listHTML += '<div style="font-size: 1.3rem; color: white; flex: 1;">' + fullName + '</div>';
                    listHTML += '</div>';
                });
                
                listHTML += '</div>';
            }
            
            listHTML += '</div>';
            listHTML += '</div>';
            
            overlay.innerHTML = listHTML;
            overlay.style.display = 'block';
            
            const closeList = (e) => {
                if (e && e.key && e.key !== 'Escape' && e.key !== 'Esc') {
                    return;
                }
                overlay.style.display = 'none';
                overlay.innerHTML = '';
                document.removeEventListener('keydown', closeList, true);
            };
            
            document.addEventListener('keydown', closeList, true);
        }
        
        // Prize winner
        function pickPrizeWinner() {
            const participants = Array.from(connectedParticipants.values());
            
            if (participants.length === 0) {
                alert('No participants to choose from!');
                return;
            }
            
            const winner = participants[Math.floor(Math.random() * participants.length)];
            const winnerName = winner.lastInitial ? 
                winner.firstName + ' ' + winner.lastInitial + '.' : winner.firstName;
            
            alert('🎉 Winner: ' + winnerName);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case 'a':
                case 'A':
                    e.preventDefault();
                    showAudienceList();
                    break;
                case 'w':
                case 'W':
                    e.preventDefault();
                    pickPrizeWinner();
                    break;
            }
        });
        
        // Initialize on load
        window.onload = function() {
            loadFromCookies();
            // Add some initial test participants
            addRandomParticipants(5);
        };
    </script>
</body>
</html>`;