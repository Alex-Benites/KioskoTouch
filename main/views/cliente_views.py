from django.shortcuts import render


def cliente_menu(request):
    return render(request, 'cliente/menu.html')

