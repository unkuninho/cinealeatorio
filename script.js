document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO ---
    const apiKey = '72c510d429567c89261f7a37b8ef9a0b'; // Sua chave API v3
    const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3MmM1MTBkNDI5NTY3Yzg5MjYxZjdhMzdiOGVmOWEwYiIsIm5iZiI6MTcyMzQ5MjQ5NS40Nywic3ViIjoiNjZiYTY4OGYwN2Y0N2Q5ZTMyNTNhMDA2Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.l_mih0tiuy6z0rSpNtthK25uTRqG4qIeDn2gXtl5mf0'; // Seu token Leitura v4
    const apiUrlBase = 'https://api.themoviedb.org/3';
    const apiImageBase = 'https://image.tmdb.org/t/p/w500';
    const placeholderImage = 'img/placeholder.png'; // Caminho para placeholder

    // --- ELEMENTOS DO DOM ---
    const mediaTypeSelect = document.getElementById('media-type');
    const genreSelect = document.getElementById('genre');
    const languageSelect = document.getElementById('language');
    const yearInput = document.getElementById('year');
    const minRatingSlider = document.getElementById('min-rating');
    const ratingValueSpan = document.getElementById('rating-value');
    const suggestButton = document.getElementById('suggest-button');
    const suggestButtonText = suggestButton.querySelector('.button-text');
    const suggestButtonSpinner = suggestButton.querySelector('.spinner');

    const suggestionArea = document.getElementById('suggestion-area');
    const suggestionContent = document.getElementById('suggestion-content');
    const suggestionPoster = document.getElementById('suggestion-poster');
    const suggestionTitle = document.getElementById('suggestion-title');
    const suggestionRating = document.getElementById('suggestion-rating');
    const suggestionOverview = document.getElementById('suggestion-overview');
    const overviewFallback = document.getElementById('overview-fallback');
    const suggestionTrailer = document.getElementById('suggestion-trailer');
    const saveFavoriteButton = document.getElementById('save-favorite-button');
    const errorMessageDiv = document.getElementById('error-message');

    // Modal Elements
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalListUl = document.getElementById('modal-list');
    const modalCloseButton = document.querySelector('.modal-close-button');
    const showFavoritesButton = document.getElementById('show-favorites-button');
    const showHistoryButton = document.getElementById('show-history-button');

    // --- ESTADO DA APLICAÇÃO ---
    let currentSuggestion = null;
    let genresMap = { movie: {}, tv: {} }; // Mapas separados por tipo
    let favorites = JSON.parse(localStorage.getItem('randomSuggestor_favorites')) || [];
    let history = JSON.parse(localStorage.getItem('randomSuggestor_history')) || [];
    let isLoading = false;

    // --- FUNÇÕES DA API ---
    const fetchOptions = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    };

    async function fetchData(endpoint, params = {}) {
        const urlParams = new URLSearchParams(params);
        const url = `${apiUrlBase}${endpoint}?${urlParams.toString()}`;
        console.log("Fetching:", url); // Log para debug
        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                console.error("API Error Response:", response.status, errorBody);
                throw new Error(`Erro ${response.status}: ${errorBody.status_message || response.statusText || 'Erro desconhecido da API'}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar dados:", error);
            throw error; // Re-throw para ser pego no .catch da chamada principal
        }
    }

    function setLoading(loading) {
        isLoading = loading;
        if (loading) {
            suggestButtonText.classList.add('hidden');
            suggestButtonSpinner.classList.remove('hidden');
            suggestButton.disabled = true;
            // Limpa área anterior ao carregar nova sugestão
            suggestionArea.classList.add('hidden');
             suggestionContent.classList.add('hidden'); // Garante que conteúdo interno suma
            errorMessageDiv.classList.add('hidden');
            // Reset botão favorito enquanto carrega
            saveFavoriteButton.disabled = true;
            saveFavoriteButton.textContent = '❤️ Salvar';
             saveFavoriteButton.removeAttribute('data-action');

        } else {
            suggestButtonText.classList.remove('hidden');
            suggestButtonSpinner.classList.add('hidden');
            suggestButton.disabled = false;
        }
    }

    async function loadGenres() {
        const mediaType = mediaTypeSelect.value;
        // Se já carregamos os gêneros para este tipo, não busca de novo (simples cache)
        if (genresMap[mediaType] && Object.keys(genresMap[mediaType]).length > 0) {
             populateGenreSelect(mediaType);
             return;
        }

        const endpoint = `/genre/${mediaType}/list`;
        try {
            const data = await fetchData(endpoint, { language: 'pt-BR' });
            if (data && data.genres) {
                genresMap[mediaType] = {}; // Limpa/Inicia mapa para o tipo
                data.genres.forEach(genre => {
                    genresMap[mediaType][genre.id] = genre.name;
                });
                populateGenreSelect(mediaType); // Preenche o select
            } else {
                console.error("Resposta de gêneros inválida:", data);
                showError("Não foi possível carregar os gêneros.");
            }
        } catch (error) {
             showError(`Erro ao carregar gêneros: ${error.message}`);
        }
    }

     function populateGenreSelect(mediaType) {
        genreSelect.innerHTML = '<option value="">Qualquer Gênero</option>'; // Limpa opções antigas
        const currentGenres = genresMap[mediaType] || {};

        // Ordena gêneros alfabeticamente
        const sortedGenreIds = Object.keys(currentGenres).sort((a, b) =>
            currentGenres[a].localeCompare(currentGenres[b], 'pt-BR')
        );

        sortedGenreIds.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = currentGenres[id];
            genreSelect.appendChild(option);
        });

         // Adiciona opção "Anime" manualmente se for TV (Gênero ID 16 = Animação, Keyword ID 210024 = Anime)
        if (mediaType === 'tv') {
             const animeOption = document.createElement('option');
             animeOption.value = '16&with_keywords=210024'; // Combinação especial
             animeOption.textContent = 'Anime (Animação Japonesa)';
             genreSelect.appendChild(animeOption);
        }
     }


    async function getRandomSuggestion() {
        if (isLoading) return;
        setLoading(true);
        currentSuggestion = null; // Reseta sugestão anterior

        try {
            const mediaType = mediaTypeSelect.value;
            const selectedGenreValue = genreSelect.value;
            const language = languageSelect.value || 'pt-BR'; // Default se 'Qualquer'
            const year = yearInput.value;
            const minRating = minRatingSlider.value;

            let discoverParams = {
                language: language,
                region: 'BR',
                'vote_average.gte': minRating,
                'vote_count.gte': 150, // Aumentar um pouco para mais relevância?
                sort_by: 'popularity.desc',
                include_adult: false
            };

            // Lógica para gênero (incluindo Anime especial)
            if (selectedGenreValue) {
                if (selectedGenreValue.includes('&')) { // Caso especial do Anime
                    const parts = selectedGenreValue.split('&');
                    discoverParams['with_genres'] = parts[0]; // ID do gênero (16)
                    const keywordPart = parts[1].split('=');
                    discoverParams[keywordPart[0]] = keywordPart[1]; // with_keywords=210024
                } else {
                    discoverParams.with_genres = selectedGenreValue;
                }
            }

            if (year && /^\d{4}$/.test(year)) { // Valida se é um ano de 4 dígitos
                if (mediaType === 'movie') {
                    discoverParams.primary_release_year = year;
                } else { // tv
                    discoverParams.first_air_date_year = year;
                }
            }

            // 1. Buscar total de páginas (primeira página para ter uma base)
            const initialData = await fetchData(`/discover/${mediaType}`, { ...discoverParams, page: 1 });
            if (!initialData || initialData.total_results === 0) {
                throw new Error("Nenhum resultado encontrado com esses filtros. Tente filtros mais amplos!");
            }

            const totalPages = initialData.total_pages;
            const maxPage = Math.min(totalPages, 500); // Limite da API TMDB
            const randomPage = Math.floor(Math.random() * maxPage) + 1;

            // 2. Buscar página aleatória
            const pageData = await fetchData(`/discover/${mediaType}`, { ...discoverParams, page: randomPage });
            if (!pageData || pageData.results.length === 0) {
                 // Tentar buscar a primeira página como fallback se a aleatória falhar
                 console.warn("Página aleatória vazia, tentando página 1");
                 const firstPageData = await fetchData(`/discover/${mediaType}`, { ...discoverParams, page: 1 });
                 if (!firstPageData || firstPageData.results.length === 0) {
                    throw new Error("Não foi possível obter uma sugestão aleatória (nem na pág. 1). Verifique os filtros.");
                 }
                 pageData.results = firstPageData.results; // Usa resultados da primeira página
            }

            // 3. Escolher item aleatório da página
            const randomIndex = Math.floor(Math.random() * pageData.results.length);
            const randomItem = pageData.results[randomIndex];

            // 4. Buscar trailer (Opcional: buscar detalhes completos aqui se precisar de mais dados sempre)
             // const detailedItem = await fetchData(`/${mediaType}/${randomItem.id}`, { language: 'pt-BR', append_to_response: 'videos' });
             // const itemToDisplay = detailedItem || randomItem; // Usa detalhado se disponível
             // Adapte a busca de trailer abaixo se usar append_to_response

            const videoData = await fetchData(`/${mediaType}/${randomItem.id}/videos`, { language: 'pt-BR,en-US' }); // Busca em PT e EN
            let trailerUrl = null;
            if (videoData && videoData.results.length > 0) {
                const trailer =
                    // Prioridade: Trailer Oficial YouTube PT-BR
                    videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official && v.iso_639_1 === 'pt') ||
                    // Oficial YouTube EN
                    videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official && v.iso_639_1 === 'en') ||
                    // Qualquer Trailer YouTube PT-BR
                    videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'pt') ||
                     // Qualquer Trailer YouTube EN
                    videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'en') ||
                    // Qualquer Trailer YouTube
                    videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');

                if (trailer) {
                    trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
                }
            }

            // 5. Exibir sugestão
            displaySuggestion(randomItem, mediaType, trailerUrl);

            // 6. Adicionar ao histórico
            addToHistory(randomItem, mediaType);

        } catch (error) {
            showError(`Falha ao buscar sugestão: ${error.message}`);
            currentSuggestion = null; // Garante que não há sugestão em caso de erro
            updateFavoriteButtonStatus(); // Desabilita o botão fav
        } finally {
            setLoading(false);
        }
    }

    // --- FUNÇÕES DE UI ---

    function displaySuggestion(item, mediaType, trailerUrl) {
        currentSuggestion = {
            id: item.id,
            title: item.title || item.name,
            type: mediaType,
            poster_path: item.poster_path,
            overview: item.overview,
            vote_average: item.vote_average
        };

        suggestionTitle.textContent = currentSuggestion.title;
        suggestionPoster.src = item.poster_path ? `${apiImageBase}${currentSuggestion.poster_path}` : placeholderImage;
        suggestionPoster.alt = `Poster de ${currentSuggestion.title}`;
        suggestionRating.textContent = currentSuggestion.vote_average > 0 ? currentSuggestion.vote_average.toFixed(1) : "N/A";

        // Exibição da Sinopse com Fallback
        overviewFallback.classList.add('hidden'); // Esconde msg alternativa por padrão
        if (currentSuggestion.overview) {
            suggestionOverview.textContent = currentSuggestion.overview;
            suggestionOverview.style.fontStyle = 'normal'; // Garante estilo normal
        } else {
            suggestionOverview.textContent = ""; // Limpa se não houver sinopse principal
            overviewFallback.classList.remove('hidden'); // Mostra mensagem alternativa
        }

        if (trailerUrl) {
            suggestionTrailer.href = trailerUrl;
            suggestionTrailer.classList.remove('hidden');
        } else {
            suggestionTrailer.classList.add('hidden');
        }

        updateFavoriteButtonStatus();

        // Mostrar a área
         suggestionContent.classList.remove('hidden'); // Mostra conteúdo interno primeiro
        suggestionArea.classList.remove('hidden'); // Mostra a área container
        errorMessageDiv.classList.add('hidden'); // Esconde erros anteriores
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.classList.remove('hidden');
        // Pode ser útil mostrar o erro dentro da suggestion-area se ela já estiver sendo usada para layout
         suggestionArea.classList.remove('hidden'); // Garante que a área onde o erro aparece esteja visível
         suggestionContent.classList.add('hidden'); // Esconde o conteúdo normal da sugestão
    }

    function updateRatingDisplay() {
        ratingValueSpan.textContent = parseFloat(minRatingSlider.value).toFixed(1);
    }

    function updateFavoriteButtonStatus() {
         if (!currentSuggestion) {
             saveFavoriteButton.disabled = true;
             saveFavoriteButton.textContent = '❤️ Salvar';
              saveFavoriteButton.removeAttribute('data-action');
             return;
         };

         const isFavorite = favorites.some(fav => fav.id === currentSuggestion.id && fav.type === currentSuggestion.type);
         if (isFavorite) {
             saveFavoriteButton.textContent = '💔 Remover';
              saveFavoriteButton.setAttribute('data-action', 'remove'); // Atributo para CSS
         } else {
             saveFavoriteButton.textContent = '❤️ Salvar';
              saveFavoriteButton.setAttribute('data-action', 'save'); // Atributo para CSS
         }
         saveFavoriteButton.disabled = false;
     }

    // --- FUNÇÕES DE LOCALSTORAGE (Favoritos e Histórico) ---

    function saveToLocalStorage(key, data) {
        // Adiciona prefixo para evitar conflitos com outros apps no mesmo domínio
        localStorage.setItem(`randomSuggestor_${key}`, JSON.stringify(data));
    }

    function addToFavorites() {
        if (!currentSuggestion || isLoading) return;

        const existingIndex = favorites.findIndex(fav => fav.id === currentSuggestion.id && fav.type === currentSuggestion.type);

        if (existingIndex > -1) { // Já é favorito, remove
            favorites.splice(existingIndex, 1);
            console.log("Removido dos favoritos:", currentSuggestion.title);
        } else { // Não é favorito, adiciona
            // Guarda apenas os dados necessários no favorito
             const favoriteItem = {
                 id: currentSuggestion.id,
                 title: currentSuggestion.title,
                 type: currentSuggestion.type,
                 poster_path: currentSuggestion.poster_path, // Útil para exibir na lista talvez
                 vote_average: currentSuggestion.vote_average
             };
            favorites.push(favoriteItem);
            console.log("Adicionado aos favoritos:", currentSuggestion.title);
        }

        saveToLocalStorage('favorites', favorites);
        updateFavoriteButtonStatus();
    }

    function addToHistory(item, mediaType) {
         const historyItem = {
             id: item.id,
             title: item.title || item.name,
             type: mediaType,
             date: new Date().toISOString() // Salva em formato padrão ISO
         };
         // Evita duplicados consecutivos no histórico
         if (history.length > 0 && history[0].id === historyItem.id && history[0].type === historyItem.type) {
             return;
         }

         history.unshift(historyItem); // Adiciona no início
         if (history.length > 50) { // Limita o histórico
             history.pop(); // Remove o mais antigo
         }
         saveToLocalStorage('history', history);
     }

     // --- FUNÇÕES DO MODAL ---

    function openListModal(type) {
        const isFavorites = type === 'favorites';
        const items = isFavorites ? favorites : history;
        modalTitle.textContent = isFavorites ? 'Meus Favoritos' : 'Histórico de Sugestões';

        modalListUl.innerHTML = ''; // Limpa lista anterior
        if (items.length === 0) {
            modalListUl.innerHTML = `<li>Sua lista está vazia.</li>`;
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                let text = `${item.title} (${item.type === 'movie' ? 'Filme' : 'Série/TV'})`;
                if (!isFavorites && item.date) { // Adiciona data formatada para histórico
                     const date = new Date(item.date);
                     const formattedDate = date.toLocaleString('pt-BR', {
                         day: '2-digit', month: '2-digit', year: 'numeric',
                         hour: '2-digit', minute: '2-digit'
                     });
                    text += `<span> - ${formattedDate}</span>`;
                }
                 // Adicionar botão de remover favorito (opcional)
                 // if (isFavorites) {
                 //     text += ` <button class="remove-fav-btn" data-id="${item.id}" data-type="${item.type}">Remover</button>`;
                 // }
                li.innerHTML = text; // Usar innerHTML por causa do span/button
                modalListUl.appendChild(li);
            });
        }
        modal.classList.remove('hidden');
         // Trava o scroll do body enquanto o modal estiver aberto
         document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        // Libera o scroll do body
         document.body.style.overflow = '';
    }


    // --- EVENT LISTENERS ---
    minRatingSlider.addEventListener('input', updateRatingDisplay);
    suggestButton.addEventListener('click', getRandomSuggestion);
    saveFavoriteButton.addEventListener('click', addToFavorites);
    mediaTypeSelect.addEventListener('change', loadGenres); // Recarrega gêneros ao mudar tipo

    // Abrir Modal
    showFavoritesButton.addEventListener('click', () => openListModal('favorites'));
    showHistoryButton.addEventListener('click', () => openListModal('history'));

    // Fechar Modal
    modalCloseButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        // Fecha se clicar no fundo escuro (fora do modal-content)
        if (event.target === modal) {
            closeModal();
        }
    });
     // Fechar modal com tecla Esc
     document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });


    // --- INICIALIZAÇÃO ---
    updateRatingDisplay();
    loadGenres(); // Carrega gêneros iniciais para o tipo padrão (movie)
    // updateFavoriteButtonStatus(); // Chamado dentro de displaySuggestion e erro

    console.log("App inicializado.");

}); // Fim do DOMContentLoaded