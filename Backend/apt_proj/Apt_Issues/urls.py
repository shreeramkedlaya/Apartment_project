from django.urls import path
from .views.issue_views import IssueAPIView
from .views.category_views import IssueCategoryAPIView

urlpatterns = [
    path("categories/", IssueCategoryAPIView.as_view(), name="issue-category-list"),
    path("categories/<int:pk>/", IssueCategoryAPIView.as_view(), name="issue-category-detail"),
    path("", IssueAPIView.as_view(), name="issue-list"),
    path("<int:pk>/", IssueAPIView.as_view(), name="issue-detail"),
]