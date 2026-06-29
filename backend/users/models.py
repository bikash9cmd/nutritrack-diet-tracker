from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    GOAL_CHOICES = [
        ('lose', 'Lose Weight'),
        ('maintain', 'Maintain Weight'),
        ('gain', 'Gain Muscle'),
    ]
    ACTIVITY_CHOICES = [
        ('sedentary', 'Sedentary'),
        ('light', 'Lightly Active'),
        ('moderate', 'Moderately Active'),
        ('active', 'Very Active'),
        ('extra', 'Extra Active'),
    ]

    age = models.PositiveIntegerField(null=True, blank=True)
    height_cm = models.FloatField(null=True, blank=True)
    weight_kg = models.FloatField(null=True, blank=True)
    goal = models.CharField(max_length=20, choices=GOAL_CHOICES, default='maintain')
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_CHOICES, default='moderate')
    daily_calorie_target = models.PositiveIntegerField(null=True, blank=True)

    def calculate_tdee(self):
        """Calculate Total Daily Energy Expenditure using Mifflin-St Jeor."""
        if not all([self.age, self.height_cm, self.weight_kg]):
            return None
        if self.gender == 'male':
            bmr = 10 * self.weight_kg + 6.25 * self.height_cm - 5 * self.age + 5
        else:
            bmr = 10 * self.weight_kg + 6.25 * self.height_cm - 5 * self.age - 161

        multipliers = {
            'sedentary': 1.2, 'light': 1.375, 'moderate': 1.55,
            'active': 1.725, 'extra': 1.9,
        }
        return int(bmr * multipliers.get(self.activity_level, 1.55))

    def __str__(self):
        return self.username
