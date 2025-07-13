document.addEventListener('DOMContentLoaded', () => {
    const playPauseButton = document.getElementById('playPauseButton');
    const audioPlayer = document.getElementById('audioPlayer');
    const statusMessage = document.getElementById('statusMessage');

    let isPlaying = false;

    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            audioPlayer.pause();
            playPauseButton.textContent = 'Включить Радио';
            statusMessage.textContent = 'Радио остановлено.';
            isPlaying = false;
        } else {
            // Проверяем, удалось ли начать воспроизведение
            const playPromise = audioPlayer.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    playPauseButton.textContent = 'Выключить Радио';
                    statusMessage.textContent = 'Радио играет...';
                    isPlaying = true;
                }).catch(error => {
                    // Обработка ошибки, если воспроизведение не удалось (например, из-за политики автовоспроизведения браузера)
                    statusMessage.textContent = 'Не удалось воспроизвести радио. Возможно, требуется взаимодействие пользователя.';
                    console.error('Ошибка воспроизведения:', error);
                    isPlaying = false; // Убедиться, что состояние корректно
                });
            }
        }
    });

    // Обработчики событий для аудиоплеера
    audioPlayer.addEventListener('play', () => {
        statusMessage.textContent = 'Радио играет...';
        playPauseButton.textContent = 'Выключить Радио';
        isPlaying = true;
    });

    audioPlayer.addEventListener('pause', () => {
        statusMessage.textContent = 'Радио остановлено.';
        playPauseButton.textContent = 'Включить Радио';
        isPlaying = false;
    });

    audioPlayer.addEventListener('error', (e) => {
        statusMessage.textContent = 'Ошибка загрузки или воспроизведения радио.';
        console.error('Ошибка аудиоплеера:', e);
        isPlaying = false;
        playPauseButton.textContent = 'Включить Радио';
    });

    audioPlayer.addEventListener('waiting', () => {
        statusMessage.textContent = 'Буферизация...';
    });

    audioPlayer.addEventListener('stalled', () => {
        statusMessage.textContent = 'Проблема с сетью или потоком...';
    });
});
