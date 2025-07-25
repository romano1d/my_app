// Определяем URL потока как константу (обновлено на ваш URL)
const streamUrl = 'https://myradio24.org/52340'; 
let audio = null; // Объявляем audio как изменяемую переменную

// Обновлены ID элементов, чтобы соответствовать index.html
const playPauseButton = document.getElementById('togglePlayPause');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const statusText = document.getElementById('statusMessage'); // Обновлено

let isPlaying = false; // Состояние воспроизведения

function startPlayback() {
    if (!audio) {
        audio = new Audio(); // Создаем объект Audio, если его еще нет
        // Опционально: можно добавить обработчики событий для аудио
        audio.addEventListener('playing', () => {
            console.log('Аудио начало играть');
            statusText.textContent = 'Воспроизведение';
            playPauseButton.disabled = false;
        });
        audio.addEventListener('waiting', () => {
            console.log('Буферизация...');
            statusText.textContent = 'Буферизация...';
            playPauseButton.disabled = true;
        });
        audio.addEventListener('error', (e) => {
            console.error('Ошибка в аудио:', e);
            statusText.textContent = 'Ошибка воспроизведения';
            playPauseButton.disabled = false;
            isPlaying = false;
            updateButtonState();
            alert('Не удалось начать воспроизведение. Поток недоступен или проблемы с сетью.');
        });
        audio.addEventListener('ended', () => {
            console.log('Поток завершился. Возможно, потеряно соединение.');
            statusText.textContent = 'Поток завершен. Переподключение...';
            // Можно попытаться перезапустить или просто остановить
            stopPlayback();
        });
    }

    // Всегда устанавливаем src и загружаем его, чтобы гарантировать начало с текущего момента
    audio.src = streamUrl;
    audio.load(); // Загружаем поток заново
    
    statusText.textContent = 'Подключение...';
    playPauseButton.disabled = true; // Отключаем кнопку на время подключения

    audio.play().then(() => {
        // isPlaying и обновление статуса теперь происходит в обработчике 'playing'
        // чтобы избежать ложного статуса "Воспроизведение" до того, как звук реально пошел
        isPlaying = true; // Устанавливаем здесь для корректного состояния кнопки
        updateButtonState();
        // statusText.textContent и playPauseButton.disabled будут обновлены в 'playing'
        console.log('Аудио поток инициирован.');
    }).catch(error => {
        isPlaying = false;
        updateButtonState();
        statusText.textContent = 'Ошибка воспроизведения';
        playPauseButton.disabled = false;
        console.error('Ошибка при запуске аудио (возможно, пользователь не разрешил автовоспроизведение):', error);
        // Дополнительное предупреждение для пользователя, если ошибка из-за политики браузера
        if (error.name === "NotAllowedError") {
             alert('Для воспроизведения звука необходимо ваше взаимодействие с страницей. Попробуйте еще раз нажать кнопку.');
        } else {
             alert('Не удалось начать воспроизведение. Проверьте ваше подключение или попробуйте позже.');
        }
    });
}

function stopPlayback() {
    if (audio) {
        audio.pause();
        // Очищаем источник, чтобы сбросить поток и предотвратить дальнейшую буферизацию
        audio.src = ''; 
        audio.load();   // Загружаем пустой источник, чтобы убедиться в остановке
        isPlaying = false;
        updateButtonState();
        statusText.textContent = 'Остановлено';
        console.log('Аудио поток остановлен.');
    }
}

function updateButtonState() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline';
    } else {
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
    }
}

playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
});

// Инициализация состояния кнопки при загрузке страницы
updateButtonState();

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js') // Убедитесь, что путь правильный
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
