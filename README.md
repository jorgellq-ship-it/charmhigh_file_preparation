# CharmHigh File Preparation

Aplicação web para transformar arquivos Pick & Place em CSV e receitas DPV para a CharmHigh CHMT36VB, além de conferir a placa e corrigir a origem de pacotes Gerber.

## Recursos

- conversão de Pick & Place para CSV e DPV;
- importação de receitas DPV existentes para revisão e nova exportação, preservando as demais tabelas da máquina;
- atribuição manual de feeders;
- alteração individual ou em massa de velocidade, `Skip`, verificação de vácuo e uso da visão;
- exibição dos ângulos finais gravados no DPV para cada grupo de componentes;
- geração automática do MStack para cada grupo de componente sem feeder;
- associações automáticas com `Skip` ativado por segurança;
- tabela responsiva, sem rolagem horizontal;
- correção de origem e visualização de contornos Gerber;
- importação e exportação da biblioteca de feeders.

Todo o processamento acontece localmente no navegador: os arquivos selecionados não são enviados para um servidor.

## Executar localmente

Abra `index.html` diretamente em um navegador moderno. Como alternativa, sirva a pasta com qualquer servidor HTTP estático.

## Publicar no DigitalOcean App Platform

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/jorgellq-ship-it/charmhigh_file_preparation/tree/main)

O repositório já contém as especificações `.do/app.yaml` e `.do/deploy.template.yaml`.

Pelo painel da DigitalOcean:

1. Abra **App Platform → Create App**.
2. Conecte a conta GitHub e selecione `jorgellq-ship-it/charmhigh_file_preparation`.
3. Selecione a branch `main` e mantenha o deploy automático ativado.
4. Confirme o recurso como **Static Site** e o documento inicial como `index.html`.
5. Conclua a criação da aplicação.

O botão de deploy direto exige que o repositório seja público. Para repositórios privados, use a integração GitHub dentro do painel da DigitalOcean.

## Segurança da máquina

As posições MStack criadas automaticamente ficam com `Skip` ligado. Confirme feeder, altura, passo da fita, cabeça, rotação e coordenadas antes de liberar a montagem. Faça o primeiro teste em baixa velocidade e sem componentes nas cabeças.
