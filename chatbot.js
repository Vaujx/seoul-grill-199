// Simple chatbot using if-else logic
document.addEventListener('DOMContentLoaded', function() {
    // Create the chat widget HTML structure
    const chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.innerHTML = `
        <div class="chat-icon" id="chat-icon">
            <i class="fas fa-robot"></i>
            <span class="notification-dot"></span>
        </div>
        <div class="chat-popup" id="chat-popup">
            <div class="chat-header">
                <div class="chat-title">
                    <i class="fas fa-robot"></i>
                    <span>Seoul Grill Assistant</span>
                </div>
                <div class="chat-controls">
                    <button class="minimize-btn" id="minimize-btn">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    <div class="message-content">
                        <p>👋 Hello! I'm your Seoul Grill 199 assistant. How can I help you today?</p>
                    </div>
                </div>
                <div class="message bot">
                    <div class="message-content">
                        <p>You can ask me about our menu, ordering process, delivery, or anything else!</p>
                    </div>
                </div>
            </div>
            <div class="suggested-questions" id="suggested-questions">
                <button class="question-btn">What are your opening hours?</button>
                <button class="question-btn">How do I place an order?</button>
                <button class="question-btn">Do you offer delivery?</button>
                <button class="question-btn">What's your bestseller?</button>
            </div>
            <div class="chat-input">
                <input type="text" id="user-input" placeholder="Type your question here...">
                <button id="send-button">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Append the chat widget to the body
    document.body.appendChild(chatWidget);
    
    // Get DOM elements
    const chatIcon = document.getElementById('chat-icon');
    const chatPopup = document.getElementById('chat-popup');
    const minimizeBtn = document.getElementById('minimize-btn');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const questionButtons = document.querySelectorAll('.question-btn');
    
    // Toggle chat popup
    chatIcon.addEventListener('click', function() {
        chatPopup.classList.toggle('active');
        chatIcon.classList.toggle('active');
        
        // Remove notification dot when opened
        document.querySelector('.notification-dot').style.display = 'none';
        
        // Focus on input field
        if (chatPopup.classList.contains('active')) {
            userInput.focus();
        }
    });
    
    // Minimize chat popup
    minimizeBtn.addEventListener('click', function() {
        chatPopup.classList.remove('active');
        chatIcon.classList.remove('active');
    });
    
    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user' : 'bot');
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        
        // Use paragraph for better formatting
        const messagePara = document.createElement('p');
        messagePara.textContent = message;
        messageContent.appendChild(messagePara);
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'bot', 'typing-indicator');
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }
    
    // Function to process user input and generate a response
    function processUserInput(input) {
        // Convert input to lowercase for easier matching
        const lowerInput = input.toLowerCase();
        
        // Simple if-else logic for common questions
        if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
            return "Hello! How can I help you today?";
        } 
        else if (lowerInput.includes('opening') || lowerInput.includes('hours') || lowerInput.includes('time')) {
            return "We're open from 10:00 AM to 10:00 PM, seven days a week!";
        } 
        else if (lowerInput.includes('location') || lowerInput.includes('address') || lowerInput.includes('where')) {
            return "We're located at 123 Korean Street, Manila. You can find us on Google Maps!";
        } 
        else if (lowerInput.includes('delivery') || lowerInput.includes('deliver')) {
            return "Yes, we offer delivery within a 5km radius. Delivery is free for orders over ₱1000!";
        } 
        else if (lowerInput.includes('menu') || lowerInput.includes('food') || lowerInput.includes('eat')) {
            return "Our menu features authentic Korean BBQ, including samgyupsal, beef, and seafood options. You can view our full menu on our website!";
        } 
        else if (lowerInput.includes('bestseller') || lowerInput.includes('popular') || lowerInput.includes('recommend')) {
            return "Our most popular item is the Premium Samgyupsal Set, which includes 5 different cuts of pork and a variety of side dishes!";
        } 
        else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('how much')) {
            return "Our prices range from ₱199 for our basic set to ₱599 for our premium sets. We also have group packages available!";
        } 
        else if (lowerInput.includes('reservation') || lowerInput.includes('reserve') || lowerInput.includes('book')) {
            return "Yes, you can make a reservation by calling us at (02) 123-4567 or through our website. We recommend reserving at least 1 day in advance for weekends!";
        } 
        else if (lowerInput.includes('payment') || lowerInput.includes('pay') || lowerInput.includes('cash')) {
            return "We accept cash, credit/debit cards, and mobile payment methods like GCash and PayMaya.";
        } 
        else if (lowerInput.includes('order') || lowerInput.includes('how to order')) {
            return "To place an order, simply click on the 'ORDER' button on any menu item. You can then proceed to checkout when you're ready!";
        } 
        else if (lowerInput.includes('contact') || lowerInput.includes('phone') || lowerInput.includes('call')) {
            return "You can contact us at (02) 123-4567 or email us at info@seoulgrill199.com";
        } 
        else if (lowerInput.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with?";
        } 
        else if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
            return "Thank you for chatting with us! Feel free to come back if you have more questions.";
        } 
        else if (lowerInput.includes('track') || lowerInput.includes('order status')) {
            return "You can track your order by going to our 'Track Order' section and entering your order ID.";
        }
        else if (lowerInput.includes('cancel') || lowerInput.includes('refund')) {
            return "To cancel an order, please contact us within 15 minutes of placing it. Refunds are processed within 3-5 business days.";
        }
        else if (lowerInput.includes('vegetarian') || lowerInput.includes('vegan')) {
            return "Yes, we offer vegetarian options! Our Vegetable Set includes a variety of fresh vegetables and tofu.";
        }
        else if (lowerInput.includes('allergy') || lowerInput.includes('allergic')) {
            return "Please inform us about any allergies when placing your order. We can accommodate most dietary restrictions.";
        }
        else if (lowerInput.includes('side dish') || lowerInput.includes('banchan')) {
            return "All our sets come with traditional Korean side dishes (banchan) including kimchi, pickled radish, and bean sprouts.";
        }
        else if (lowerInput.includes('spicy') || lowerInput.includes('hot')) {
            return "You can request your preferred spice level for applicable dishes. We offer mild, medium, and spicy options.";
        }
        else {
            return "I'm not sure I understand. Could you rephrase your question or choose from one of the suggested questions below?";
        }
    }
    
    // Event listener for send button
    sendButton.addEventListener('click', function() {
        const userMessage = userInput.value.trim();
        
        if (userMessage) {
            // Add user message to chat
            addMessage(userMessage, true);
            
            // Clear input field
            userInput.value = '';
            
            // Show typing indicator
            const typingIndicator = showTypingIndicator();
            
            // Process user input and get response with a delay to simulate thinking
            setTimeout(function() {
                // Remove typing indicator
                typingIndicator.remove();
                
                // Add bot response
                const botResponse = processUserInput(userMessage);
                addMessage(botResponse);
            }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
        }
    });
    
    // Event listener for Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
    
    // Event listeners for suggested question buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('question-btn')) {
            const question = e.target.textContent;
            userInput.value = question;
            sendButton.click();
        }
    });
    
    // Show notification dot after 3 seconds to attract attention
    setTimeout(function() {
        if (!chatPopup.classList.contains('active')) {
            document.querySelector('.notification-dot').style.display = 'block';
        }
    }, 3000);
});