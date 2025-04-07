from enum import Enum

class FormType(Enum):
    INSPECTION = "inspection"
    COVERLETTER = "coverletter"
    RENTAL_APPLICATION = "rentalApplication"
    AIRPORT_PICKUP = "airportPickup"

    @classmethod
    def is_valid_form_type(cls, form_type):
        return form_type in cls._value2member_map_


