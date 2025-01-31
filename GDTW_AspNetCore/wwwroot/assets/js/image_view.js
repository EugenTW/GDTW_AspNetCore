let authToken;

document.addEventListener('DOMContentLoaded', async function () {
    const path = window.location.pathname;
    const isAlbumMode = path.startsWith('/a/');
    const code = path.split('/')[2];
    const statusApiUrl = isAlbumMode ? '/is_api/isAlbumPasswordNeeded' : '/is_api/isImagePasswordNeeded';
    const passwordApiUrl = isAlbumMode ? '/is_api/checkAlbumPassword' : '/is_api/checkImagePassword';
    const downloadApiUrl = isAlbumMode ? '/is_api/downloadAlbumImages' : '/is_api/downloadSingleImage';
    const requestData = {code: code};

    // if (isLocalhost) {
    //     console.log('Running on localhost - skipping API requests.');
    //     initPage(downloadApiUrl, isAlbumMode);
    //     return;
    // }

    // Step 1: Check if password is needed
    try {
        const response = await fetchWithRetry(statusApiUrl, requestData);
        const result = await response.json();

        if (!result.isValid) {
            window.location.href = '/error_410';
            return;
        }

        // If a password is required, show password modal
        if (result.requiresPassword) {
            showPasswordModal();
            setupPasswordValidation(passwordApiUrl, code, isAlbumMode);
        } else {
            // No password needed, store the token and initialize the page
            if (result.token) {
                authToken = result.token;
            }
            initPage(downloadApiUrl, isAlbumMode);
        }
    } catch (error) {
        window.location.href = '/error';
    }
});

// Initialize page and fetch images
async function initPage(downloadApiUrl, isAlbumMode) {
    hidePasswordModal();
    try {
        const response = await fetch(downloadApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({token: authToken})
        });

        const result = await response.json();
        if (result.error) {
            alert(result.error);
            return;
        }

        // Display content based on mode (Album or Single Image)
        if (isAlbumMode) {
            displayImages(result);
        } else {
            displaySingleImage(result);
        }
    } catch (error) {
        // console.error('Error occurred during initPage execution:', error);
        alert('載入圖片失敗，請稍後再試。\nFailed to load images. Please try again later.');
    }
}

// Function to display album images
function displayImages(data) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    const isNsfw = data.siaNsfw === 1;

    const pageUrlDiv = document.createElement('div');
    pageUrlDiv.classList.add('page-url-text');
    const currentPageUrl = window.location.href;
    const url = new URL(currentPageUrl);
    const cleanUrl = url.host + url.pathname;
    pageUrlDiv.innerHTML = `Share Gallery URL: ${cleanUrl}`;
    pageUrlDiv.addEventListener('click', function () {
        copyToClipboard(cleanUrl);
        showCopiedMessage(pageUrlDiv);
    });

    const downloadAlbumButton = document.createElement('button');
    downloadAlbumButton.classList.add('download-album-button');
    downloadAlbumButton.textContent = '⬇️';
    downloadAlbumButton.title = '下載所有圖片 - Download Gallery';
    downloadAlbumButton.addEventListener('click', function () {
        downloadEntireAlbum(data.images);
    });

    const albumUrlContainer = document.createElement('div');
    albumUrlContainer.classList.add('album-url-container');
    albumUrlContainer.appendChild(pageUrlDiv);
    albumUrlContainer.appendChild(downloadAlbumButton);
    gallery.appendChild(albumUrlContainer);

    data.images.forEach(image => {
        const photoDiv = document.createElement('div');
        photoDiv.classList.add('photo');
        const imgElement = document.createElement('img');
        imgElement.src = new URL(image.imageUrl, window.location.origin).href;
        imgElement.alt = image.siName;
        imgElement.classList.add('gallery-image');
        imgElement.onerror = function () {
            this.src = '/images/pic_not_found.webp';
        };

        if (isNsfw) {
            const nsfwMask = document.createElement('div');
            nsfwMask.classList.add('nsfw-mask');
            nsfwMask.innerHTML = 'R15 or R18 Content<br>NSFW - Click to reveal';
            nsfwMask.addEventListener('click', () => {
                nsfwMask.style.display = 'none';
            });
            photoDiv.appendChild(imgElement);
            photoDiv.appendChild(nsfwMask);
        } else {
            photoDiv.appendChild(imgElement);
        }

        const urlDiv = document.createElement('div');
        urlDiv.classList.add('single-mode-text');
        urlDiv.innerHTML = `Share URL: ${image.imageSingleModeUrl}`;
        urlDiv.addEventListener('click', function () {
            copyToClipboard(image.imageSingleModeUrl);
            showCopiedMessage(urlDiv);
        });

        const openLink = document.createElement('a');
        openLink.classList.add('open-link-button');
        openLink.textContent = '🔎';
        openLink.title = '原始尺寸 - Full Size';
        openLink.href = image.imageUrl;
        openLink.target = '_blank';
        openLink.rel = 'noopener noreferrer';

        const downloadLink = document.createElement('a');
        downloadLink.classList.add('download-link-button');
        downloadLink.textContent = '⬇️';
        downloadLink.title = '下載圖片 - Download';
        downloadLink.href = image.imageUrl;
        downloadLink.download = image.siName;
        downloadLink.setAttribute('target', '_blank');
        downloadLink.setAttribute('rel', 'noopener noreferrer');

        const urlContainer = document.createElement('div');
        urlContainer.classList.add('url-container');
        urlContainer.appendChild(urlDiv);
        urlContainer.appendChild(openLink);
        urlContainer.appendChild(downloadLink);

        photoDiv.appendChild(urlContainer);
        gallery.appendChild(photoDiv);
    });

    gallery.classList.remove('hidden');
}

function downloadEntireAlbum(images) {
    if (!images || images.length === 0) {
        console.error("No images to download.");
        return;
    }

    const zip = new JSZip();

    const currentPageUrl = window.location.href;
    const url = new URL(currentPageUrl);
    let albumName = url.host + url.pathname;

    albumName = albumName.replace(/[\/:?*"<>|]/g, "_");

    let count = 0;

    images.forEach((image) => {
        fetch(image.imageUrl)
            .then(response => response.blob())
            .then(blob => {
                let fileName = image.siName;
                fileName = fileName.replace(/[\/:?*"<>|]/g, "_");

                zip.file(`${fileName}.jpg`, blob);
                count++;

                if (count === images.length) {
                    zip.generateAsync({ type: "blob" }).then(content => {
                        saveAs(content, `${albumName}.zip`);
                    });
                }
            })
            .catch(error => console.error(`Error downloading ${image.imageUrl}:`, error));
    });
}

// Function to display a single image
function displaySingleImage(data) {
    const singlePhotoDiv = document.getElementById('single-photo');
    singlePhotoDiv.innerHTML = '';

    const pageUrlDiv = document.createElement('div');
    pageUrlDiv.classList.add('page-url-text');
    const currentPageUrl = window.location.href;
    const url = new URL(currentPageUrl);
    const cleanUrl = url.origin + url.pathname;

    pageUrlDiv.innerHTML = `Share Photo URL: ${cleanUrl}`;
    pageUrlDiv.addEventListener('click', function () {
        copyToClipboard(currentPageUrl);
        showCopiedMessage(pageUrlDiv);
    });

    singlePhotoDiv.appendChild(pageUrlDiv);

    const photoWrapper = document.createElement('div');
    photoWrapper.classList.add('photo-wrapper');

    const imgElement = document.createElement('img');
    const imageUrl = data.imageUrl.startsWith('http') ? data.imageUrl : new URL(data.imageUrl, window.location.origin).href;
    imgElement.src = imageUrl;
    imgElement.alt = data.siName;
    imgElement.id = 'photo-img';
    photoWrapper.appendChild(imgElement);

    if (data.siNsfw === 1) {
        const nsfwMask = document.createElement('div');
        nsfwMask.classList.add('nsfw-mask');
        nsfwMask.textContent = 'NSFW - Click to reveal';
        nsfwMask.addEventListener('click', () => {
            nsfwMask.classList.add('hidden');
        });
        photoWrapper.appendChild(nsfwMask);
    }

    singlePhotoDiv.appendChild(photoWrapper);

    const openLink = document.createElement('a');
    openLink.classList.add('open-link-button');
    openLink.textContent = '🔎';
    openLink.title = '原始尺寸 - Full Size';
    openLink.href = imageUrl;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';

    const downloadLink = document.createElement('a');
    downloadLink.classList.add('download-link-button');
    downloadLink.textContent = '⬇️';
    downloadLink.title = '下載圖片 - Download';
    downloadLink.href = imageUrl;
    downloadLink.download = data.siName;
    downloadLink.setAttribute('target', '_blank');
    downloadLink.setAttribute('rel', 'noopener noreferrer');

    const urlContainer = document.createElement('div');
    urlContainer.classList.add('url-container');
    urlContainer.appendChild(openLink);
    urlContainer.appendChild(downloadLink);

    singlePhotoDiv.appendChild(urlContainer);
    singlePhotoDiv.classList.remove('hidden');
}



// Show the password input modal
function showPasswordModal() {
    const passwordModal = document.getElementById('password-modal');
    if (passwordModal) {
        passwordModal.classList.remove('hidden');
    }
}

// Hide the password input modal
function hidePasswordModal() {
    const passwordModal = document.getElementById('password-modal');
    if (passwordModal) {
        passwordModal.classList.add('hidden');
    }
}

// Set up password validation and submission
function setupPasswordValidation(passwordApiUrl, code, isAlbumMode) {
    const passwordForm = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');

    passwordSubmit.disabled = true;

    // Validate password input on blur
    passwordInput.addEventListener('blur', function () {
        const password = passwordInput.value.trim();
        const isValid = /^\d{4,10}$/.test(password);

        // If password format is invalid, clear the input and disable the submit button
        if (!isValid && password !== '') {
            alert('密碼格式不符合，請輸入4~10位數字\nPassword format is incorrect. Please enter 4-10 digits.');
            passwordInput.value = '';
            passwordSubmit.disabled = true;

            setTimeout(() => {
                passwordInput.focus();
            }, 0);
        }
    });

    // Enable the submit button if the input is valid
    passwordInput.addEventListener('input', function () {
        const password = passwordInput.value.trim();
        const isValid = /^\d{4,10}$/.test(password);
        passwordSubmit.disabled = !isValid;
    });

    // Handle password form submission
    passwordForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const password = passwordInput.value.trim();
        if (password === '') return;

        const passwordRequestData = {code: code, password: password};

        try {
            const response = await fetchWithRetry(passwordApiUrl, passwordRequestData);
            const result = await response.json();

            if (result.checkPassword) {
                if (result.token) {
                    authToken = result.token;
                }
                hidePasswordModal();
                initPage(isAlbumMode ? '/is_api/downloadAlbumImages' : '/is_api/downloadSingleImage', isAlbumMode);
            } else {
                alert('密碼錯誤，請重新輸入\nIncorrect password, please try again.');
                passwordInput.value = '';
                passwordSubmit.disabled = true;

                setTimeout(() => {
                    passwordInput.focus();
                }, 0);
            }
        } catch (error) {
            alert('系統錯誤，請稍後再試。\nSystem error, please try again later.');
        }
    });
}


// Fetch with retry logic
async function fetchWithRetry(url, data, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if (response.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries++;
            } else {
                return response;
            }
        } catch (error) {
            break;
        }
    }
    throw new Error('Too many attempts, please try again later.');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard:', text);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function showCopiedMessage() {
    const toast = document.createElement('div');
    toast.textContent = '已複製網址 - URL Copied!';
    toast.classList.add('toast-message');
    document.body.appendChild(toast);

    setTimeout(() => {
        document.body.removeChild(toast);
    }, 1500);
}

document.addEventListener('DOMContentLoaded', function () {
    const backToTopButton = document.getElementById('scrollToTop');

    if (!backToTopButton) {
        console.error('Back to Top button not found!');
        return;
    }

    const minBottom = 175;
    const maxBottom = 40;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const distanceToBottom = docHeight - (scrollTop + windowHeight);

        if (distanceToBottom <= minBottom) {
            backToTopButton.style.bottom = `${minBottom}px`;
        } else {
            backToTopButton.style.bottom = `${maxBottom}px`;
        }

        if (scrollTop > 500) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    backToTopButton.addEventListener('click', () => {
        console.log('Back to Top button clicked!');
        document.documentElement.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        document.body.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});




