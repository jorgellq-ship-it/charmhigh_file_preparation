# CharmHigh File Preparation

Aplicação web para transformar arquivos Pick & Place em CSV e receitas DPV para a CharmHigh CHMT36VB, além de conferir a placa e corrigir a origem de pacotes Gerber.

## Recursos

- conversão de Pick & Place para CSV e DPV;
- importação de receitas DPV existentes para revisão e nova exportação, preservando as demais tabelas da máquina;
- atribuição manual de feeders;
- alteração individual ou em massa de velocidade, Pull Speed, `Skip`, verificação de vácuo e uso da visão;
- exibição dos ângulos finais gravados no DPV para cada grupo de componentes;
- geração do MStack a partir das posições preenchidas manualmente ou importadas da biblioteca, sem atribuição automática de números;
- tabela responsiva, sem rolagem horizontal;
- correção de origem e visualização de contornos Gerber;
- importação e exportação da biblioteca de feeders.

Todo o processamento acontece localmente no navegador: os arquivos selecionados não são enviados para um servidor.

### Pull Speed

Na etapa **Configurar montagem**, use **Ajustes em massa → Pull Speed → Aplicar** para atualizar todos os tipos ativos (não marcados como **Remover**), ou edite o campo individual na tabela. O valor é salvo em `Station.nPullStripSpeed`, na biblioteca de feeders e na lista do operador; não altera a velocidade de montagem nem os ângulos.

DPVs importados mantêm o Pull Speed de cada Station. Bibliotecas antigas sem esse campo mantêm o valor atual. O editor aceita inteiros não negativos; `0` é o valor nominal descrito no [manual CharmHigh, seção 10.1.2](https://www.charmhigh-smt.com/file/datasheet/chm-t36va_user_manual.pdf). Essa validação de formato não substitui a conferência dos valores aceitos pelo firmware da sua máquina.

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

Importe uma biblioteca de feeders ou informe cada posição física manualmente. Confirme feeder, altura, passo da fita, Pull Speed, cabeça, rotação e coordenadas antes de liberar a montagem. Faça o primeiro teste em baixa velocidade e sem componentes nas cabeças.
