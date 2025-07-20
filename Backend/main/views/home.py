from django.http import HttpResponse, HttpResponseRedirect

def home(request):
    return HttpResponseRedirect('/administrador/welcome')
