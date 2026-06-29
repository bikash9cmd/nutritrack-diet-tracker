from django.db import models
from django.conf import settings


class FoodItem(models.Model):
    """Nutrition database entry."""
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    calories_per_100g = models.FloatField()
    protein_per_100g = models.FloatField(default=0)
    carbs_per_100g = models.FloatField(default=0)
    fat_per_100g = models.FloatField(default=0)
    fiber_per_100g = models.FloatField(default=0)
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='custom_foods'
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.calories_per_100g} kcal/100g)"


class MealLog(models.Model):
    """A single food entry in the user's daily log."""
    MEAL_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meal_logs')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    meal_type = models.CharField(max_length=20, choices=MEAL_CHOICES)
    quantity_g = models.FloatField(help_text="Quantity in grams")
    logged_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField()

    @property
    def calories(self):
        return round(self.food_item.calories_per_100g * self.quantity_g / 100, 1)

    @property
    def protein(self):
        return round(self.food_item.protein_per_100g * self.quantity_g / 100, 1)

    @property
    def carbs(self):
        return round(self.food_item.carbs_per_100g * self.quantity_g / 100, 1)

    @property
    def fat(self):
        return round(self.food_item.fat_per_100g * self.quantity_g / 100, 1)

    class Meta:
        ordering = ['-date', '-logged_at']

    def __str__(self):
        return f"{self.user.username} - {self.food_item.name} ({self.date})"


class DailySummary(models.Model):
    """Cached daily nutrition totals."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='daily_summaries')
    date = models.DateField()
    total_calories = models.FloatField(default=0)
    total_protein = models.FloatField(default=0)
    total_carbs = models.FloatField(default=0)
    total_fat = models.FloatField(default=0)
    calorie_target = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    @property
    def calorie_balance(self):
        if self.calorie_target:
            return self.calorie_target - self.total_calories
        return None

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.total_calories} kcal)"


class WeightLog(models.Model):
    """Track weight over time."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='weight_logs')
    date = models.DateField()
    weight_kg = models.FloatField()
    notes = models.CharField(max_length=200, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username} - {self.weight_kg}kg on {self.date}"
