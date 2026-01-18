const movies = [
    {
        title: 'A Origem',
        genre: 'Ficção científica',
        year: 2010,
        runtime: '2h 28min',
        description: 'Um ladrão especialista em invadir sonhos recebe a missão mais difícil da carreira: plantar uma ideia na mente de alguém.'
    },
    {
        title: 'Parasita',
        genre: 'Suspense',
        year: 2019,
        runtime: '2h 12min',
        description: 'Uma família sem recursos se infiltra na casa de uma família rica, desencadeando uma cadeia de acontecimentos inesperados.'
    },
    {
        title: 'O Fabuloso Destino de Amélie Poulain',
        genre: 'Romance',
        year: 2001,
        runtime: '2h 2min',
        description: 'Amélie decide transformar a vida das pessoas ao seu redor enquanto busca o próprio caminho para a felicidade.'
    },
    {
        title: 'Pantera Negra',
        genre: 'Ação',
        year: 2018,
        runtime: '2h 15min',
        description: 'T’Challa retorna a Wakanda para assumir o trono, mas precisa defender seu reino de um adversário poderoso.'
    },
    {
        title: 'Antes do Amanhecer',
        genre: 'Drama',
        year: 1995,
        runtime: '1h 41min',
        description: 'Dois jovens se conhecem em um trem e decidem passar uma noite inesquecível caminhando por Viena.'
    },
    {
        title: 'Whiplash: Em Busca da Perfeição',
        genre: 'Drama',
        year: 2014,
        runtime: '1h 46min',
        description: 'Um baterista ambicioso enfrenta o rigor extremo de um professor exigente para alcançar o sucesso.'
    },
    {
        title: 'A Viagem de Chihiro',
        genre: 'Animação',
        year: 2001,
        runtime: '2h 5min',
        description: 'Chihiro entra em um mundo mágico e precisa enfrentar desafios para salvar seus pais.'
    },
    {
        title: 'Cidade de Deus',
        genre: 'Crime',
        year: 2002,
        runtime: '2h 10min',
        description: 'A história de jovens envolvidos com o crime na Cidade de Deus, uma das comunidades mais violentas do Rio.'
    },
    {
        title: 'Mad Max: Estrada da Fúria',
        genre: 'Ação',
        year: 2015,
        runtime: '2h',
        description: 'Em um deserto pós-apocalíptico, Max e Furiosa desafiam um tirano para libertar um grupo de mulheres.'
    },
    {
        title: 'O Poderoso Chefão',
        genre: 'Crime',
        year: 1972,
        runtime: '2h 55min',
        description: 'A saga da família Corleone mostra o crescimento de Michael no comando do império mafioso.'
    }
];

const randomButton = document.getElementById('random-button');
const suggestionCard = document.getElementById('suggestion-card');
const emptyState = document.getElementById('empty-state');
const movieTitle = document.getElementById('movie-title');
const movieGenre = document.getElementById('movie-genre');
const movieYear = document.getElementById('movie-year');
const movieRuntime = document.getElementById('movie-runtime');
const movieDescription = document.getElementById('movie-description');

let lastIndex = null;

function getRandomMovie() {
    if (movies.length === 0) {
        return null;
    }

    if (movies.length === 1) {
        return movies[0];
    }

    let index = Math.floor(Math.random() * movies.length);
    while (index === lastIndex) {
        index = Math.floor(Math.random() * movies.length);
    }
    lastIndex = index;
    return movies[index];
}

function updateSuggestion() {
    const movie = getRandomMovie();

    if (!movie) {
        emptyState.textContent = 'Nenhum filme disponível para sugestão.';
        suggestionCard.classList.add('hidden');
        return;
    }

    movieTitle.textContent = movie.title;
    movieGenre.textContent = movie.genre;
    movieYear.textContent = movie.year;
    movieRuntime.textContent = `Duração: ${movie.runtime}`;
    movieDescription.textContent = movie.description;

    suggestionCard.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

randomButton.addEventListener('click', updateSuggestion);
