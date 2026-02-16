# Aplicativo - Análise Vasco 2026

Aplicativo web (HTML/CSS/JS puro) para registrar partidas do Vasco e gerar estatísticas da temporada 2026.

## Funcionalidades

- CRUD de partidas (adicionar, editar e excluir).
- Campos de partida: data, rodada, fase, campeonato, escalação, substituições, árbitro, uniforme, estádio, público, renda e preços de ingresso.
- Subfeatures por partida:
  - Gols (tipo, minutagem com formato `45+X`/`90+X`, autor, assistência e tipo de assistência).
  - Cartões amarelo/vermelho/segundo amarelo.
  - Pênaltis defendidos.
- Elenco inicial completo (fornecido no pedido).
- Importação de elenco por texto (`Nome, Posição, Camisa, FotoURL`).
- Visualização de jogadores por posição e página/detalhe individual.
- Sócio torcedor com categorias e descontos editáveis.
- Stats automáticas:
  - Team stats (jogos, vitórias, empates, derrotas, gols pró/contra e médias).
  - Stats de mandante/casa (médias e totais de público, renda e ingresso médio).
  - Player stats (artilharia, assistências, participações, cartões, gol contra, pênalti perdido, parceiros em gols).
  - Ranking de pontos com multiplicador por campeonato.

## Regras de pontuação aplicadas

- Gol = 5
- Assistência = 2.5
- Cartão amarelo = -1.5
- Segundo amarelo = -1.5 (somado com vermelho)
- Vermelho = -3
- Clean sheet (defensores/goleiros com 60+ min em jogo sem sofrer gol) = 6
- Pênalti defendido (tempo normal) = 10
- Gol contra = -5
- Pênalti perdido = -7

Multiplicadores por campeonato:

- Campeonato Carioca: 1x
- Copa Sulamericana: 3x
- Copa do Brasil: 6x
- Brasileirão: 9x

## Como usar

1. Abra o `index.html` no navegador.
2. Cadastre partidas no formulário e salve.
3. Use os blocos de texto para inserir escalação, gols, cartões e substituições no formato indicado.
4. Importe elenco adicional no painel de jogadores.
5. Consulte rankings e estatísticas atualizadas automaticamente.

## Persistência

Os dados ficam salvos no `localStorage` do navegador (`vasco-analise-2026-v1`).
