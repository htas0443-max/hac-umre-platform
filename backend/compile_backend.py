"""
Backend Python Bytecode Compilation

Production ortamında Python dosyalarını bytecode'a (.pyc) derler.
Geri mühendisliği zorlaştırır ve başlangıç süresini kısaltır.

Kullanım:
    python compile_backend.py

Not: Tam obfuscation için pyarmor (ticari) gerekir.
     compileall yalnızca bytecode derleme yapar.
"""
import compileall
import sys
import os

def compile_backend():
    """Backend Python dosyalarını bytecode'a derle."""
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"[COMPILE] Backend dizini: {backend_dir}")
    print("[COMPILE] Python bytecode derleme başlatılıyor...")
    
    success = compileall.compile_dir(
        backend_dir,
        maxlevels=10,
        force=True,       # Mevcut .pyc dosyalarını yeniden derle
        optimize=2,        # Optimize seviye 2: docstring'leri de kaldır
        quiet=1,           # Sadece hataları göster
    )
    
    if success:
        print("[COMPILE] ✅ Bytecode derleme başarılı!")
        
        # __pycache__ dizinlerindeki .pyc sayısını göster
        pyc_count = 0
        for root, dirs, files in os.walk(backend_dir):
            for f in files:
                if f.endswith('.pyc'):
                    pyc_count += 1
        
        print(f"[COMPILE] 📦 {pyc_count} adet .pyc dosyası oluşturuldu")
    else:
        print("[COMPILE] ❌ Bytecode derleme sırasında hatalar oluştu!")
        sys.exit(1)

if __name__ == "__main__":
    compile_backend()
