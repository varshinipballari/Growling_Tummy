'use strict';
const {
	WebhookClient
} = require('dialogflow-fulfillment');
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
exports.dialogflowFirebaseFulfillment = (request, response) => {
	const agent = new WebhookClient({
		request,
		response
	});
	console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
	const foodCarts = [{
			name: "Thai Delight",
			cuisine: "Thai",
			location: "downtown",
			rating: 4.5,
			hours: "11:00 AM - 9:00 PM",
			dineIn: true,
			takeOut: true,
			vegan: true,
			vegetarian: true,
			popularItems: ["Pad Thai", "Green Curry", "Mango Sticky Rice"]
		},
		{
			name: "Taco Heaven",
			cuisine: "Mexican",
			location: "Pioneer Square",
			rating: 4.8,
			hours: "10:00 AM - 10:00 PM",
			dineIn: false,
			takeOut: true,
			vegan: false,
			vegetarian: true,
			popularItems: ["Street Tacos", "Burrito Bowl", "Quesadillas"]
		},
		{
			name: "Spice of India",
			cuisine: "Indian",
			location: "downtown",
			rating: 4.7,
			hours: "11:30 AM - 8:30 PM",
			dineIn: true,
			takeOut: true,
			vegan: true,
			vegetarian: true,
			popularItems: ["Butter Chicken", "Palak Paneer", "Chana Masala"]
		},
		{
			name: "Dragon Wok",
			cuisine: "Chinese",
			location: "Chinatown",
			rating: 4.6,
			hours: "11:00 AM - 11:00 PM",
			dineIn: true,
			takeOut: true,
			vegan: false,
			vegetarian: true,
			popularItems: ["Kung Pao Chicken", "Vegetable Fried Rice", "Dumplings"]
		}
	];

	function welcome(agent) {
		agent.add(`Hi Welcome!`);
	}

	function fallback(agent) {
		agent.add(`I didn't understand`);
		agent.add(`I'm sorry, can you try again?`);
	}

	function findFoodCartsByTime(agent) {
		const cuisine = agent.parameters.cuisine;
		const time = agent.parameters.time; // This is a timestamp, e.g., "2025-02-21T10:00:00-08:00"
		console.log('FindFoodCartsByTime triggered');
		console.log('Cuisine:', cuisine);
		console.log('Time:', time);
		if (!cuisine || !time) {
			agent.add('Please provide both cuisine and time.');
			return;
		}
		const matchingCarts = foodCarts.filter(cart =>
			cart.cuisine.toLowerCase() === cuisine.toLowerCase()
		);
		if (matchingCarts.length === 0) {
			agent.add(`Sorry, I couldn't find any ${cuisine} food carts.`);
			return;
		}
		// Extract the time part from the timestamp (e.g., "10:00:00")
		const timePart = time.split('T')[1].split('-')[0]; // Extracts "10:00:00"
		const [userHours, userMinutes] = timePart.split(':').map(Number); // Converts to numbers
		// Convert user time to minutes since midnight
		const userTimeInMinutes = userHours * 60 + userMinutes;
		let response = `Here are the ${cuisine} food carts open at ${formatTime(userHours, userMinutes)}:\n`;
		let foundOpenCarts = false;
		matchingCarts.forEach(cart => {
			const [openTime, closeTime] = cart.hours.split(' - ');
			const openMinutes = parseTimeToMinutes(openTime);
			const closeMinutes = parseTimeToMinutes(closeTime);
			if (userTimeInMinutes >= openMinutes && userTimeInMinutes <= closeMinutes) {
				response += `\n${cart.name} - ${cart.hours}`;
				foundOpenCarts = true;
			}
		});
		if (!foundOpenCarts) {
			response = `Sorry, I couldn't find any ${cuisine} food carts open at ${formatTime(userHours, userMinutes)}.`;
		}
		agent.add(response);
	}
	// Helper function to parse time strings (e.g., "11:00 AM") into minutes since midnight
	function parseTimeToMinutes(timeStr) {
		const [time, modifier] = timeStr.split(' ');
		let [hours, minutes] = time.split(':');
		hours = parseInt(hours);
		minutes = parseInt(minutes);
		if (modifier === 'PM' && hours !== 12) hours += 12;
		if (modifier === 'AM' && hours === 12) hours = 0;
		return hours * 60 + minutes;
	}
	// Helper function to format hours and minutes into a readable time string (e.g., "10:00 AM")
	function formatTime(hours, minutes) {
		const modifier = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12 || 12; // Convert to 12-hour format
		minutes = minutes.toString().padStart(2, '0'); // Ensure two digits
		return `${hours}:${minutes} ${modifier}`;
	}

	function findFoodCartsByRatingLocation(agent) {
    const rating = agent.parameters.rating;
    const location = agent.parameters.location;

    console.log('FindFoodCartsByRatingLocation triggered');
    console.log('Rating:', rating);
    console.log('Location:', location);

    if (!rating && !location) {
        agent.add('Please provide at least a rating or a location.');
        return;
    }

    let matchingCarts = foodCarts; 

    if (rating) { 
        matchingCarts = matchingCarts.filter(cart => cart.rating >= rating);
    }

    if (location) { 
        matchingCarts = matchingCarts.filter(cart => cart.location >= location);
    }

    if (matchingCarts.length === 0) {
        let message = "Sorry, I couldn't find any food carts";
        if (rating) message += ` rated ${rating} or above`;
        if (location) message += ` near ${location.city}`;
        agent.add(message + ".");
        return;
    }

    let response = "Here are the food carts that match your criteria:\n";
    matchingCarts.forEach(cart => {
        response += `\n${cart.name} - ${cart.rating}⭐ - ${cart.location}`; // Include location in the response
    });

    agent.add(response);
}

	function findFoodCartsByDiningOptions(agent) {
		const cuisine = agent.parameters.cuisine;
		const diningOption = agent.parameters.diningOption;
		const dietaryPreference = agent.parameters.dietaryPreference;
		console.log('FindFoodCartsByDiningOptions triggered');
		console.log('Cuisine:', cuisine);
		console.log('Dining Option:', diningOption);
		console.log('Dietary Preference:', dietaryPreference);
		let matchingCarts = foodCarts;
		if (cuisine) {
			matchingCarts = matchingCarts.filter(cart =>
				cart.cuisine.toLowerCase() === cuisine.toLowerCase()
			);
		}
		if (diningOption) {
			matchingCarts = matchingCarts.filter(cart => {
				if (diningOption.toLowerCase() === 'dine-in') return cart.dineIn;
				if (diningOption.toLowerCase() === 'to-go' || diningOption.toLowerCase() === 'takeout') return cart.takeOut;
				return true;
			});
		}
		if (dietaryPreference) {
			matchingCarts = matchingCarts.filter(cart => {
				if (dietaryPreference.toLowerCase() === 'vegan') return cart.vegan;
				if (dietaryPreference.toLowerCase() === 'vegetarian') return cart.vegetarian;
				return true;
			});
		}
		if (matchingCarts.length === 0) {
			let message = `Sorry, I couldn't find any food carts`;
			if (cuisine) message += ` serving ${cuisine} cuisine`;
			if (diningOption) message += ` with ${diningOption} option`;
			if (dietaryPreference) message += ` offering ${dietaryPreference} options`;
			agent.add(message + ".");
			return;
		}
		let response = `Here are the food carts that match your preferences:\n`;
		matchingCarts.forEach(cart => {
			response += `\n${cart.name} - ${cart.cuisine}`;
			response += `\nPopular items: ${cart.popularItems.join(", ")}`;
			response += `\nOptions: ${cart.dineIn ? 'Dine-in available' : 'Take-out only'}`;
			response += `\nDietary: ${[
        cart.vegan ? 'Vegan' : '',
        cart.vegetarian ? 'Vegetarian' : ''
      ].filter(Boolean).join(', ') || 'Standard menu'}\n`;
		});
		agent.add(response);
	}
	let intentMap = new Map();
	intentMap.set('Welcome Intent', welcome);
	intentMap.set('Default Fallback Intent', fallback);
	intentMap.set('FindFoodCartsByTimeIntent', findFoodCartsByTime);
	intentMap.set('FindFoodCartsByRatingLocationIntent', findFoodCartsByRatingLocation);
	intentMap.set('FindFoodCartsByDiningOptionsIntent', findFoodCartsByDiningOptions);
	agent.handleRequest(intentMap);
};