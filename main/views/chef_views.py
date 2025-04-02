from django.shortcuts import render

def chef_dashboard(request):
    return render(request, 'chef/dashboard.html')