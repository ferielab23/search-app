// ====== CONFIG ======
const apikey = '30c105fa1d47477081e32ad289565f79';

// ====== DOM ======
const blogContainer = document.getElementById("blog-container");
const searchField   = document.getElementById("search-input");
const searchButton  = document.getElementById("search-button");

// ====== UTIL ======
function showStatus(message, { error = false } = {}) {
  blogContainer.innerHTML = `<p style="margin:12px 0; ${error ? "color:#c01818" : "color:#555"}">${message}</p>`;
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ====== API ======
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status && data.status !== "ok") {
    throw new Error(data.message || "API error");
  }
  return data;
}

async function fetchRandomNews() {
  const apiUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=15&apiKey=${apikey}`;
  try {
    const data = await fetchJSON(apiUrl);
    return data.articles || [];
  } catch (err) {
    console.error("Error fetching random news", err);
    return { error: err.message };
  }
}

async function fetchNewsQuery(query) {
  const q = encodeURIComponent(query);
  const apiUrl = `https://newsapi.org/v2/everything?q=${q}&pageSize=15&sortBy=publishedAt&language=en&apiKey=${apikey}`;
  try {
    const data = await fetchJSON(apiUrl);
    return data.articles || [];
  } catch (err) {
    console.error("Error fetching news by query", err);
    return { error: err.message };
  }
}

// ====== RENDER ======
function displayBlogs(articles) {
  if (!Array.isArray(articles)) {
    showStatus(articles?.error || "Something went wrong.", { error: true });
    return;
  }

  if (articles.length === 0) {
    showStatus("No results found.");
    return;
  }

  blogContainer.innerHTML = "";
  articles.forEach((article) => {
    const blogCard = document.createElement("div");
    blogCard.classList.add("blog-card");

    const img = document.createElement("img");
    if (article.urlToImage) {
      img.src = article.urlToImage;
      img.alt = article.title || "news image";
    } else {
      img.src = "https://via.placeholder.com/480x270?text=No+Image";
      img.alt = "Placeholder image";
    }

    const title = document.createElement("h2");
    const safeTitle = article.title || "Untitled";
    const truncatedTitle = safeTitle.length > 60 ? safeTitle.slice(0, 60) + "…" : safeTitle;
    title.textContent = truncatedTitle;

    const description = document.createElement("p");
    const safeDesc = article.description || article.content || "Description not available.";
    const truncatedDes = safeDesc.length > 140 ? safeDesc.slice(0, 140) + "…" : safeDesc;
    description.textContent = truncatedDes;

    blogCard.appendChild(img);
    blogCard.appendChild(title);
    blogCard.appendChild(description);
    blogCard.addEventListener("click", () => {
      if (article.url) window.open(article.url, "_blank");
    });

    blogContainer.appendChild(blogCard);
  });
}

// ====== SEARCH HANDLERS ======
async function handleSearch() {
  const query = searchField.value.trim();
  if (!query) return;

  showStatus("Loading…");
  const articles = await fetchNewsQuery(query);

  if (articles?.error) {
    showStatus(`Error: ${articles.error}`, { error: true });
    return;
  }
  displayBlogs(articles);
}

const debouncedInputSearch = debounce(handleSearch, 500);

// Input: debounced search as user types
searchField.addEventListener("input", debouncedInputSearch);

// Press Enter to search immediately
searchField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSearch();
  }
});

// Button: immediate search
searchButton.addEventListener("click", handleSearch);

// ====== INITIAL LOAD ======
(async () => {
  showStatus("Loading top headlines…");
  const articles = await fetchRandomNews();
  if (articles?.error) {
    showStatus(`Error: ${articles.error}`, { error: true });
    return;
  }
  displayBlogs(articles);
})();

