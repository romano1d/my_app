// script.js

// 1. Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован с областью видимости:', registration.scope);
            })
            .catch(error => {
                console.error('Ошибка при регистрации Service Worker:', error);
            });
    });
}

// 2. Логика Музыкального Плеера
document.addEventListener('DOMContentLoaded', () => {
    const radioPlayer = document.getElementById('radioPlayer');
    const togglePlayPauseButton = document.getElementById('togglePlayPause');
    const statusMessage = document.getElementById('statusMessage');

    let isPlaying = false; // Отслеживаем состояние плеера

    // Функция для обновления сообщения статуса и текста кнопки
    function updateStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.style.color = isError ? '#d9534f' : '#666'; // Красный для ошибок
    }

    // Обработчик события для кнопки воспроизведения/паузы
    togglePlayPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            radioPlayer.pause();
            updateStatus('Радио остановлено.');
            togglePlayPauseButton.textContent = 'Включить радио';
            isPlaying = false;
        } else {
            updateStatus('Подключение к радио...');
            togglePlayPauseButton.disabled = true; // Отключаем кнопку во время подключения

            //Перезагрузка потока гарантирует, что мы пытаемся получить новый поток
            // Это может быть полезно, если поток был прерван.
            radioPlayer.load(); 
            radioPlayer.play()
                .then(() => {
                    // Воспроизведение успешно начато
                    updateStatus('Радио играет!');
                    togglePlayPauseButton.textContent = 'Остановить радио';
                    isPlaying = true;
                    togglePlayPauseButton.disabled = false;
                })
                .catch(error => {
                    // Ошибка воспроизведения (например, пользователь не дал разрешения или проблемы с сетью)
                    console.error('Ошибка воспроизведения:', error);
                    updateStatus('Не удалось воспроизвести радио. Попробуйте снова.', true);
                    togglePlayPauseButton.textContent = 'Включить радио';
                    isPlaying = false;
                    togglePlayPauseButton.disabled = false;
                });
        }
    });

    // Добавляем обработчики событий для статуса аудиоплеера
    radioPlayer.addEventListener('playing', () => {
        updateStatus('Радио играет!');
        togglePlayPauseButton.textContent = 'Остановить радио';
        isPlaying = true;
        togglePlayPauseButton.disabled = false;
    });

    radioPlayer.addEventListener('pause', () => {
        if (!radioPlayer.ended) { // Обновляем статус, только если не конец потока (например, пользователь нажал паузу)
            updateStatus('Радио остановлено.');
            togglePlayPauseButton.textContent = 'Включить радио';
            isPlaying = false;
            togglePlayPauseButton.disabled = false;
        }
    });

    radioPlayer.addEventListener('error', (e) => {
        console.error('Audio Error:', e);
        // Более детальная обработка ошибок на основе кода ошибки
        let errorMessage = 'Ошибка воспроизведения.';
        switch (e.target.error.code) {
            case e.target.error.MEDIA_ERR_ABORTED:
                errorMessage = 'Воспроизведение прервано пользователем.';
                break;
            case e.target.error.MEDIA_ERR_NETWORK:
                errorMessage = 'Ошибка сети. Проверьте ваше соединение.';
                break;
            case e.target.error.MEDIA_ERR_DECODE:
                errorMessage = 'Ошибка декодирования аудио. Поток поврежден или не поддерживается.';
                break;
            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Формат аудио не поддерживается вашим браузером.';
                break;
            default:
                errorMessage = 'Неизвестная ошибка воспроизведения.';
                break;
        }
        updateStatus(errorMessage + ' Попробуйте снова.', true);
        togglePlayPauseButton.textContent = 'Включить радио';
        isPlaying = false;
        togglePlayPauseButton.disabled = false;
    });

    radioPlayer.addEventListener('waiting', () => {
        updateStatus('Буферизация...');
        togglePlayPauseButton.disabled = true; // Отключаем кнопку во время буферизации
    });

    radioPlayer.addEventListener('stalled', () => {
        updateStatus('Соединение прервано. Попытка восстановить...');
        togglePlayPauseButton.disabled = true;
    });

    radioPlayer.addEventListener('ended', () => {
        updateStatus('Поток завершен.');
        togglePlayPauseButton.textContent = 'Включить радио';
        isPlaying = false;
        togglePlayPauseButton.disabled = false;
    });

    // Начальный статус при загрузке страницы
    updateStatus('Нажмите "Включить радио" для начала прослушивания.');
});
