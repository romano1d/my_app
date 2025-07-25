document.addEventListener('DOMContentLoaded', () => {
    const radioPlayer = document.getElementById('radioPlayer');
    const togglePlayPauseButton = document.getElementById('togglePlayPause');
    const statusMessage = document.getElementById('statusMessage');

    let isPlaying = false; // Track player state

    // --- Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker зарегистрирован:', registration.scope);
                    statusMessage.textContent = 'Приложение готово.';
                })
                .catch(error => {
                    console.error('Ошибка регистрации Service Worker:', error);
                    statusMessage.textContent = 'Ошибка загрузки приложения.';
                });
        });
    } else {
        console.warn('Service Workers не поддерживаются в этом браузере.');
        statusMessage.textContent = 'Ваш браузер не поддерживает автономный режим.';
    }

    // --- Audio Player Logic ---
    togglePlayPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            radioPlayer.pause();
        } else {
            // Handle play promise to catch errors (e.g., user not interacting first)
            const playPromise = radioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Ошибка при попытке воспроизведения:", error);
                    statusMessage.textContent = 'Ошибка воспроизведения. Пожалуйста, попробуйте еще раз.';
                    isPlaying = false;
                    togglePlayPauseButton.textContent = 'Включить радио';
                });
            }
        }
    });

    radioPlayer.addEventListener('play', () => {
        isPlaying = true;
        togglePlayPauseButton.textContent = 'Выключить радио';
        statusMessage.textContent = 'Радио играет...';
    });

    radioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        togglePlayPauseButton.textContent = 'Включить радио';
        statusMessage.textContent = 'Радио на паузе.';
    });

    radioPlayer.addEventListener('waiting', () => {
        statusMessage.textContent = 'Буферизация...';
    });

    radioPlayer.addEventListener('stalled', () => {
        statusMessage.textContent = 'Поток остановлен. Проверьте соединение.';
    });
    
    radioPlayer.addEventListener('error', (e) => {
        console.error('Ошибка аудиоплеера:', e);
        isPlaying = false;
        togglePlayPauseButton.textContent = 'Включить радио';
        let errorMessage = 'Ошибка воспроизведения радио.';
        // More specific error handling based on MediaError.code
        if (radioPlayer.error) {
            switch (radioPlayer.error.code) {
                case radioPlayer.error.MEDIA_ERR_ABORTED:
                    errorMessage = 'Воспроизведение прервано пользователем.';
                    break;
                case radioPlayer.error.MEDIA_ERR_NETWORK:
                    errorMessage = 'Ошибка сети. Проверьте подключение к Интернету.';
                    break;
                case radioPlayer.error.MEDIA_ERR_DECODE:
                    errorMessage = 'Ошибка декодирования аудио. Поток поврежден или не поддерживается.';
                    break;
                case radioPlayer.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Аудиоформат не поддерживается вашим браузером или поток недоступен.';
                    break;
                default:
                    errorMessage = 'Неизвестная ошибка воспроизведения.';
                    break;
            }
        }
        statusMessage.textContent = errorMessage;
    });

    // Initial status update
    statusMessage.textContent = 'Нажмите "Включить радио" для начала.';
});
