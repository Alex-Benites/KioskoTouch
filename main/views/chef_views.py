from django.shortcuts import render

def chef_dashboard(request):
    return render(request, 'chef/chef_index.html')