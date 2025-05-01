# Usar imagem oficial do Python
FROM python:3.11-slim

# Configurar variável de ambiente
ENV PYTHONUNBUFFERED=1
ENV NODE_VERSION=18.x

# Definir diretório de trabalho
WORKDIR /app

# Instalar Node.js e npm
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -sL https://deb.nodesource.com/setup_${NODE_VERSION} | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependências e instalá-las
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o frontend
COPY frontend/package.json frontend/package-lock.json* frontend/
WORKDIR /app/frontend
RUN npm install
WORKDIR /app

# Copiar o restante do projeto
COPY . .

# Construir o frontend
WORKDIR /app/frontend
RUN npm run build
WORKDIR /app

# Criar usuário sem privilégios para maior segurança
RUN useradd -m docker_user
RUN chown -R docker_user:docker_user /app

# Alterar para o usuário criado
USER docker_user

# Comando padrão
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
