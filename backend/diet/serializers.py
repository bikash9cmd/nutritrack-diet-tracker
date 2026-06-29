from rest_framework import serializers
from .models import FoodItem, MealLog, DailySummary, WeightLog


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = ['id', 'name', 'brand', 'calories_per_100g', 'protein_per_100g',
                  'carbs_per_100g', 'fat_per_100g', 'fiber_per_100g', 'is_custom']
        read_only_fields = ['is_custom']


class MealLogSerializer(serializers.ModelSerializer):
    food_item_detail = FoodItemSerializer(source='food_item', read_only=True)
    calories = serializers.FloatField(read_only=True)
    protein = serializers.FloatField(read_only=True)
    carbs = serializers.FloatField(read_only=True)
    fat = serializers.FloatField(read_only=True)

    class Meta:
        model = MealLog
        fields = ['id', 'food_item', 'food_item_detail', 'meal_type',
                  'quantity_g', 'date', 'logged_at', 'calories', 'protein', 'carbs', 'fat']
        read_only_fields = ['logged_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DailySummarySerializer(serializers.ModelSerializer):
    calorie_balance = serializers.FloatField(read_only=True)
    progress_pct = serializers.SerializerMethodField()

    class Meta:
        model = DailySummary
        fields = ['id', 'date', 'total_calories', 'total_protein', 'total_carbs',
                  'total_fat', 'calorie_target', 'calorie_balance', 'progress_pct', 'notes']

    def get_progress_pct(self, obj):
        if obj.calorie_target and obj.calorie_target > 0:
            return round((obj.total_calories / obj.calorie_target) * 100, 1)
        return None


class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = ['id', 'date', 'weight_kg', 'notes', 'logged_at']
        read_only_fields = ['logged_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
