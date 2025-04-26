# -*- coding: utf-8 -*-
import logging
import ask_sdk_core.utils as ask_utils
from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import AbstractRequestHandler, AbstractExceptionHandler
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model import Response
from ask_sdk_core.utils import get_slot_value  # Import for extracting slots
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class LaunchRequestHandler(AbstractRequestHandler):
    """Handler for Skill Launch."""
    def can_handle(self, handler_input):
        return ask_utils.is_request_type("LaunchRequest")(handler_input)

    def handle(self, handler_input):
        speak_output = "Welcome! You can ask about food carts open at a certain time. What time are you looking for?"
        return handler_input.response_builder.speak(speak_output).ask(speak_output).response


class FindFoodCartsByTimeIntentHandler(AbstractRequestHandler):
    """Handler for Finding Food Carts by Time and Cuisine."""
    def can_handle(self, handler_input):
        intent_name = ask_utils.get_intent_name(handler_input)
        print(f"Intent Name: {intent_name}")  # Check if this matches your expected intent
        return ask_utils.is_intent_name("FindFoodCartsByTimeIntent")(handler_input)

    def handle(self, handler_input):
        # Extract Time and CuisineType slots
        time_slot = get_slot_value(handler_input, "Time")
        cuisine_type = get_slot_value(handler_input, "CuisineType")

        if not time_slot:
            return handler_input.response_builder.speak(
                "Please provide a time to check for open food carts."
            ).ask("What time should I check?").response

        current_time = datetime.now()

        try:
            if "AM" in time_slot or "PM" in time_slot:
                target_time = datetime.strptime(time_slot, "%I:%M %p")  # Handles "11 PM"
            else:
                target_time = datetime.strptime(time_slot, "%H:%M")  # Handles "23:00"

            target_time = target_time.replace(year=current_time.year, month=current_time.month, day=current_time.day)

            if target_time < current_time:
                target_time += timedelta(days=1)

        except ValueError:
            return handler_input.response_builder.speak(
                "I couldn't understand the time format. Try saying '11 PM' or 'now'."
            ).ask("What time should I check for?").response

    
        food_carts = [
            {"name": "Taco Express", "cuisine": "Mexican", "working_hours": ("10:00", "22:00")},
            {"name": "Spice Delight", "cuisine": "Indian", "working_hours": ("12:00", "23:00")},
            {"name": "Dragon Bites", "cuisine": "Chinese", "working_hours": ("09:00", "21:00")},
            {"name": "Pizza Haven", "cuisine": "Italian", "working_hours": ("11:00", "23:00")}
        ]


        # Filter food carts by time
        filtered_food_carts = []

        for cart in food_carts:
            start_time_str, end_time_str = cart["working_hours"]
            start_time = datetime.strptime(start_time_str, "%H:%M").time()
            end_time = datetime.strptime(end_time_str, "%H:%M").time()
            
            cart_open = False
            if start_time <= end_time:
                if start_time <= target_time.time() < end_time:
                    cart_open = True
            else:  # Handles carts open past midnight
                if start_time <= target_time.time() or target_time.time() < end_time:
                    cart_open = True
            
            if cart_open and (not cuisine_type or cuisine_type.lower() in cart["cuisine"].lower()):
                filtered_food_carts.append(cart)
           
        if not filtered_food_carts:
            speak_output = f"Sorry, I couldn't find any open food carts at {target_time.strftime('%I:%M %p')} {start_time.strftime('%I:%M %p')} {end_time.strftime('%I:%M %p')}."
            reprompt_output = f"Would you like to check for food carts at a different time?"
        else:
            food_cart_names = [cart["name"] for cart in filtered_food_carts]
            if cuisine_type:
                speak_output = f"The following {cuisine_type} food carts are open at {target_time.strftime('%I:%M %p')}: {', '.join(food_cart_names)}."
                reprompt_output = f"Would you like to know more about them?"
            else:
                speak_output = f"The following food carts are open at {target_time.strftime('%I:%M %p')}: {', '.join(food_cart_names)}."
                reprompt_output = f"Would you like to know more about them?"

        #reprompt_output = "Would you like to check for food carts at a different time?"
        print(f"Reprompt: {reprompt_output}") 
        return handler_input.response_builder.speak(speak_output).ask(reprompt_output).response



class HelpIntentHandler(AbstractRequestHandler):
    """Handler for Help Intent."""
    def can_handle(self, handler_input):
        return ask_utils.is_intent_name("AMAZON.HelpIntent")(handler_input)

    def handle(self, handler_input):
        speak_output = "You can ask about food carts open at a specific time. How can I assist you?"
        return handler_input.response_builder.speak(speak_output).ask(speak_output).response

class CancelOrStopIntentHandler(AbstractRequestHandler):
    """Handler for Cancel and Stop Intent."""
    def can_handle(self, handler_input):
        return ask_utils.is_intent_name("AMAZON.CancelIntent")(handler_input) or ask_utils.is_intent_name("AMAZON.StopIntent")(handler_input)

    def handle(self, handler_input):
        speak_output = "Goodbye!"
        return handler_input.response_builder.speak(speak_output).response

class FallbackIntentHandler(AbstractRequestHandler):
    """Handler for Unrecognized Commands."""
    def can_handle(self, handler_input):
        return ask_utils.is_intent_name("AMAZON.FallbackIntent")(handler_input)

    def handle(self, handler_input):
        speak_output = "I'm not sure what you mean. You can ask about food carts open at a certain time."
        return handler_input.response_builder.speak(speak_output).ask(speak_output).response

class SessionEndedRequestHandler(AbstractRequestHandler):
    """Handler for Session End."""
    def can_handle(self, handler_input):
        return ask_utils.is_request_type("SessionEndedRequest")(handler_input)

    def handle(self, handler_input):
        return handler_input.response_builder.response

class IntentReflectorHandler(AbstractRequestHandler):
    """For Debugging - Repeats the Intent."""
    def can_handle(self, handler_input):
        return ask_utils.is_request_type("IntentRequest")(handler_input)

    def handle(self, handler_input):
        intent_name = ask_utils.get_intent_name(handler_input)
        return handler_input.response_builder.speak(f"You just triggered {intent_name}.").response

class CatchAllExceptionHandler(AbstractExceptionHandler):
    """Generic Error Handling."""
    def can_handle(self, handler_input, exception):
        return True

    def handle(self, handler_input, exception):
        logger.error(exception, exc_info=True)
        speak_output = "Sorry, I had trouble understanding that. Please try again."
        return handler_input.response_builder.speak(speak_output).ask(speak_output).response

# Register Handlers
sb = SkillBuilder()
sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(FindFoodCartsByTimeIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(CancelOrStopIntentHandler())
sb.add_request_handler(FallbackIntentHandler())
sb.add_request_handler(SessionEndedRequestHandler())
sb.add_request_handler(IntentReflectorHandler())  # Debugging handler
sb.add_exception_handler(CatchAllExceptionHandler())

lambda_handler = sb.lambda_handler()
