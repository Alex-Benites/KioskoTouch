import win32print
import win32api
import tempfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def imprimir_factura(request):
    factura = request.data

    texto = f"""
    FACTURA #{factura.get('pedido_id')}
    Cliente: {factura.get('cliente')}
    --------------------------
    Productos:
    """
    for p in factura.get('productos', []):
        texto += f"{p['nombre']} x{p['cantidad']} ${p['precio']}\n"
    texto += f"""
    --------------------------
    Subtotal: ${factura.get('subtotal')}
    IVA: ${factura.get('iva')}
    Total: ${factura.get('total')}
    --------------------------
    ¡Gracias por su compra!
    """

    try:
        printer_name = win32print.GetDefaultPrinter()
        with tempfile.NamedTemporaryFile(delete=False, suffix='.txt') as temp:
            temp.write(texto.encode('utf-8'))
            temp.close()
            win32api.ShellExecute(
                0,
                "print",
                temp.name,
                f'/d:"{printer_name}"',
                ".",
                0
            )
        return Response({'success': True, 'printer': printer_name})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)