/**
 * Creates a typewriter effect on a given HTML element.
 * @param {HTMLElement} element The target element to display the typing effect.
 * @param {string} text The text to type out.
 * @param {number} [speed=70] The delay between characters in milliseconds.
 */
function typewriter(element, text, speed = 70) {
    if (!element) {
        console.error("Typewriter target element not found.");
        return;
    }
    if (typeof text !== 'string') {
        console.error("Typewriter text must be a string.");
        text = '';
    }
    if (typeof speed !== 'number' || speed <= 0) {
         console.warn("Typewriter Warning: Invalid speed provided. Using default 70ms.", speed);
         speed = 70;
    }

    let i = 0;
    element.innerHTML = '';
    element.style.visibility = 'visible'; 
    element.classList.remove('typing-done');

    function type() {
        if (i < text.length) {
            // Handle HTML entities correctly (like &)
            const char = text.charAt(i);
            if (char === '&' && text.substring(i).startsWith('&')) {
                const entityMatch = text.substring(i).match(/^(&[a-zA-Z]+;)|(&#\d+;)/);
                if (entityMatch) {
                    const entity = entityMatch[0];
                    element.innerHTML += entity;
                    i += entity.length;
                } else {
                     // Fallback if it looks like an entity but isn't recognized
                    element.innerHTML += char;
                    i++;
                }
            } else {
                element.innerHTML += char;
                i++;
            }
            setTimeout(type, speed);
        } else {
            // Remove cursor blinking upon completion
            element.classList.add('typing-done');
        }
    }

    // Start the typing effect
    type();
}

// init with data attributes
document.addEventListener('DOMContentLoaded', () => {
    // Select all elements intended for the typewriter effect
    const typewriterElements = document.querySelectorAll('.js-typewriter');

    if (typewriterElements.length === 0) {
        return; 
    }
    
    const observedToTargetMap = new Map();

    // lazy loading/triggering
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            
                const observedElement = entry.target;
                
                const targetElement = observedToTargetMap.get(observedElement);
		
		if (entry.isIntersecting && targetElement) {

		        // Retrieve configuration from data attributes
		        const textToType = targetElement.dataset.text;
		        console.log(targetElement.dataset.text);
		        const speed = parseInt(targetElement.dataset.speed, 10) || 80; // Use data-speed or default to 80
		        const triggerOnce = targetElement.dataset.triggerOnce !== 'false'; // Default to trigger only once

		        if (textToType === undefined) {
		            console.error("Typewriter target element is missing 'data-text' attribute:", targetElement);
		        } else {
		            console.log(`Triggering typewriter for:`, targetElement, `Observed:`, observedElement);
		            typewriter(targetElement, textToType, speed);
		        }

		        if (triggerOnce) {
		           obs.unobserve(observedElement);
		           observedToTargetMap.delete(observedElement); // housekeeping
		        }
		} else if (!entry.isIntersecting && targetElement) {
                	// Could do something when the element scrolls out of view
                }

            
        });
    }, {
        threshold: 0.5
    });

    // Observe each typewriter element
    typewriterElements.forEach(targetElement => {
        const triggerSelector = targetElement.dataset.trigger;
        let elementToObserve = targetElement; // default

        if (triggerSelector) {
            const customTrigger = document.querySelector(triggerSelector);
            if (customTrigger) {
                elementToObserve = customTrigger;
            } else {
                console.warn(`Typewriter trigger element "${triggerSelector}" not found for:`, targetElement);
            }
        }

        targetElement.style.visibility = 'hidden';
        
        observedToTargetMap.set(elementToObserve, targetElement);

        observer.observe(elementToObserve);
    });
});

