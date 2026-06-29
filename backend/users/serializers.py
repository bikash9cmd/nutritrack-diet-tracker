from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2',
                  'age', 'height_cm', 'weight_kg', 'goal', 'activity_level']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        tdee = user.calculate_tdee()
        if tdee:
            adjustments = {'lose': -500, 'maintain': 0, 'gain': +300}
            user.daily_calorie_target = tdee + adjustments.get(user.goal, 0)
            user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        return {'user': user}


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'age', 'height_cm', 'weight_kg',
                  'goal', 'activity_level', 'daily_calorie_target']
        read_only_fields = ['id', 'username']
