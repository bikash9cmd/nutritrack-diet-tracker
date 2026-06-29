from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from .models import FoodItem, MealLog, DailySummary, WeightLog
from .serializers import (FoodItemSerializer, MealLogSerializer,
                           DailySummarySerializer, WeightLogSerializer)


class FoodItemListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodItemSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'brand']

    def get_queryset(self):
        # Return standard foods + user's custom foods
        return FoodItem.objects.filter(
            is_custom=False
        ) | FoodItem.objects.filter(
            is_custom=True, created_by=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(is_custom=True, created_by=self.request.user)


class MealLogListCreateView(generics.ListCreateAPIView):
    serializer_class = MealLogSerializer

    def get_queryset(self):
        queryset = MealLog.objects.filter(user=self.request.user)
        date = self.request.query_params.get('date')
        meal_type = self.request.query_params.get('meal_type')
        if date:
            queryset = queryset.filter(date=date)
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        return queryset

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        # Refresh daily summary after logging
        self._refresh_daily_summary(request.user, request.data.get('date'))
        return response

    def _refresh_daily_summary(self, user, date):
        if not date:
            date = timezone.now().date()
        logs = MealLog.objects.filter(user=user, date=date)
        totals = {
            'total_calories': sum(l.calories for l in logs),
            'total_protein': sum(l.protein for l in logs),
            'total_carbs': sum(l.carbs for l in logs),
            'total_fat': sum(l.fat for l in logs),
            'calorie_target': user.daily_calorie_target,
        }
        DailySummary.objects.update_or_create(user=user, date=date, defaults=totals)


class MealLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MealLogSerializer

    def get_queryset(self):
        return MealLog.objects.filter(user=self.request.user)


class DailySummaryView(APIView):
    def get(self, request):
        date = request.query_params.get('date', timezone.now().date())
        summary, _ = DailySummary.objects.get_or_create(
            user=request.user, date=date,
            defaults={'calorie_target': request.user.daily_calorie_target}
        )
        # Recompute from actual logs
        logs = MealLog.objects.filter(user=request.user, date=date)
        summary.total_calories = sum(l.calories for l in logs)
        summary.total_protein = sum(l.protein for l in logs)
        summary.total_carbs = sum(l.carbs for l in logs)
        summary.total_fat = sum(l.fat for l in logs)
        summary.save()
        return Response(DailySummarySerializer(summary).data)


class WeeklyInsightView(APIView):
    def get(self, request):
        from datetime import timedelta
        today = timezone.now().date()
        week_ago = today - timedelta(days=6)
        summaries = DailySummary.objects.filter(
            user=request.user, date__gte=week_ago, date__lte=today
        ).order_by('date')

        data = DailySummarySerializer(summaries, many=True).data
        if summaries:
            avg_calories = sum(s.total_calories for s in summaries) / len(summaries)
            avg_protein = sum(s.total_protein for s in summaries) / len(summaries)
        else:
            avg_calories = avg_protein = 0

        return Response({
            'daily_data': data,
            'averages': {
                'calories': round(avg_calories, 1),
                'protein': round(avg_protein, 1),
            },
            'days_logged': summaries.count(),
        })


class WeightLogListCreateView(generics.ListCreateAPIView):
    serializer_class = WeightLogSerializer

    def get_queryset(self):
        return WeightLog.objects.filter(user=self.request.user)
