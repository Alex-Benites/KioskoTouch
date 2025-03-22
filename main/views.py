from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def index(request):
    #return HttpResponse("Hello, World!")
    #return render(request, 'main/base.html')
    return render(request, 'main/index.html')