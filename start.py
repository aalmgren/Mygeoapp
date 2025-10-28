#!/usr/bin/env python3
"""
🚀 Orquestrador: Migra Neo4j e inicia servidor local
Uso:
    python start.py          # Apenas migra e inicia servidor
    python start.py --fresh  # Apaga tudo, recria e inicia servidor
"""
import subprocess
import sys

def run_command(cmd, description):
    """Executa comando e mostra progresso"""
    print(f"\n🔄 {description}...")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"❌ Erro em: {description}")
        sys.exit(1)
    print(f"✅ {description} completo!")

if __name__ == "__main__":
    print("=" * 60)
    print("🌳 Jack and the Beanstalk - Orquestrador")
    print("=" * 60)
    
    # Verifica se quer rollback
    if "--fresh" in sys.argv:
        run_command("python migrate.py --rollback", "Rollback migrations (apagando tudo)")
    
    # Sempre faz migrate
    run_command("python migrate.py", "Apply migrations")
    
    # Inicia servidor local
    print("\n" + "=" * 60)
    print("🌐 Servidor local iniciado!")
    print("📄 Abra no navegador: http://localhost:8000/decision_tree.html")
    print("⏹️  Pressione Ctrl+C para parar")
    print("=" * 60 + "\n")
    
    try:
        subprocess.run("python -m http.server 8000", shell=True)
    except KeyboardInterrupt:
        print("\n\n👋 Servidor encerrado. Até logo!")

