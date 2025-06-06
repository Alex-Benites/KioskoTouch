import subprocess
import sys

def run_script(script, arg):
    print(f"\n--- Ejecutando: python Scripts/{script}.py {arg} ---")
    result = subprocess.run([sys.executable, f"Scripts/{script}.py", arg])
    if result.returncode != 0:
        print(f"❌ Error ejecutando {script}.py {arg}")
        sys.exit(result.returncode)

def main():
    # Crear categorías
    run_script("categorias", "crear")
    # Migrar imágenes de categorías
    run_script("categorias", "migrar_imagenes")

    # Crear estados
    run_script("estados", "crear")

    # Crear ingredientes
    run_script("ingredientes", "crear")
    # Migrar imágenes de ingredientes
    run_script("ingredientes", "migrar_imagenes")

    print("\n✅ Mega script completado correctamente.")

if __name__ == "__main__":
    main()