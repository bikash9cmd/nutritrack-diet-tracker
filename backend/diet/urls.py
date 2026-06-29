from django.urls import path
from .views import (FoodItemListCreateView, MealLogListCreateView,
                    MealLogDetailView, DailySummaryView, WeeklyInsightView,
                    WeightLogListCreateView)

urlpatterns = [
    path('foods/', FoodItemListCreateView.as_view(), name='food-list'),
    path('logs/', MealLogListCreateView.as_view(), name='meal-log-list'),
    path('logs/<int:pk>/', MealLogDetailView.as_view(), name='meal-log-detail'),
    path('summary/', DailySummaryView.as_view(), name='daily-summary'),
    path('weekly/', WeeklyInsightView.as_view(), name='weekly-insight'),
    path('weight/', WeightLogListCreateView.as_view(), name='weight-log'),
]
