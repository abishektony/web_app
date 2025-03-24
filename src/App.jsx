import React, { useState, useEffect } from "react";
import "./App.css";

const API_KEY = "9ff37e06"; // Replace with a valid OMDB API key

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("title");
  const [searchType, setSearchType] = useState("movie"); // 'movie', 'series', 'anime'
  const [movieData, setMovieData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1); // Default to season 1
  const [selectedEpisode, setSelectedEpisode] = useState(1); // Default to episode 1
  const [iframeSource, setIframeSource] = useState(""); // State to store selected iframe URL
  const [tmdbID, setTmdbID] = useState(null);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [newlyReleasedMovies, setNewlyReleasedMovies] = useState([]);

  // Function to fetch movie details based on title or ID
  const fetchMovieDetails = async (searchTerm) => {
    if (!searchTerm) return;
    setError(null);
    setMovieData(null);
    setSelectedMovie(null); // Reset the selected movie when starting a new search
    if (searchTerm.length < 3) return; // Avoid fetching for short search terms
    try {
      const queryParam = searchBy === "id" ? `i=${searchTerm}` : `s=${encodeURIComponent(searchTerm)}`; // 's' for searching by title
      const typeParam = searchType !== "movie" ? `&type=${searchType}` : ""; // Add type parameter if it's not movie
      const response = await fetch(`https://www.omdbapi.com/?${queryParam}&apikey=${API_KEY}`);
      const data = await response.json();

      if (data.Response === "True") {
        setMovieData(data);
      } else {
        setError(data.Error);
      }
    } catch (err) {
      setError("Failed to fetch details.");
    }
  };
  // Function to fetch trending movies
  const fetchTrendingMovies = async () => {
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=Avengers&type=movie&apikey=${API_KEY}`);
      const data = await response.json();
      if (data.Response === "True") {
        setTrendingMovies(data.Search);
      }
    } catch (err) {
      console.error("Failed to fetch trending movies:", err);
    }
  };
  
  // Function to fetch newly released movies
  const fetchNewlyReleasedMovies = async () => {
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=2024&type=movie&y=2024&apikey=${API_KEY}`);
      const data = await response.json();
      if (data.Response === "True") {
        setNewlyReleasedMovies(data.Search);
      }
    } catch (err) {
      console.error("Failed to fetch newly released movies:", err);
    }
  };

  // Clear movie data when search is cleared
  useEffect(() => {
    if (!searchTerm) {
      setMovieData(null);
      setSelectedMovie(null);
      setTrendingMovies([]);
      setNewlyReleasedMovies([]);
      fetchTrendingMovies();
      fetchNewlyReleasedMovies();
    }
  }, [searchTerm]);

  // Fetch trending and newly released movies on component mount
  useEffect(() => {
    if (searchTerm.length < 2) {
      fetchTrendingMovies();
      fetchNewlyReleasedMovies();
    }
  }, []); // Add an empty dependency array to ensure this runs only once on mount

  // Search as you type
  useEffect(() => {
    if (searchTerm.length > 2) {
      fetchMovieDetails(searchTerm);
      setTrendingMovies([]);
      setNewlyReleasedMovies([]);
    }
  }, [searchTerm, searchType]); // Trigger fetch when either searchTerm or searchType changes

  // Function to handle the user selection of a movie
  const handleMovieSelection = async (movieId) => {
    const selected = movieData.Search.find(movie => movie.imdbID === movieId);
    if (selected) {
      setSelectedMovie(selected);
      setSearchType(selected.Type);
      setMovieData({ Search: [] });
  
      // Fetch TMDB ID
      const id = await getTMDBID(movieId);
      setTmdbID(id);
    }
  };

  // Handle Season Selection and update iframe
  const handleSeasonSelection = (seasonNumber) => {
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1); // Reset episode to 1 when changing season
  };

  // Handle Episode Selection and update iframe
  const handleEpisodeSelection = (episodeNumber) => {
    setSelectedEpisode(episodeNumber);
  };

  const getTMDBID = async (imdbID) => {
    const TMDB_API_KEY = "c38aca661398f2d4843d264d4b4ac6f5"; // Replace with your TMDB API key
    try {
      const response = await fetch(`https://api.themoviedb.org/3/find/${imdbID}?api_key=${TMDB_API_KEY}&external_source=imdb_id`);
      const data = await response.json();
      if (data.movie_results?.length > 0) {
        return data.movie_results[0].id; // TMDB ID for movies
      } else if (data.tv_results?.length > 0) {
        return data.tv_results[0].id; // TMDB ID for TV shows
      }
    } catch (error) {
      console.error("Error fetching TMDB ID:", error);
    }
    return null; // No results found
  };

  // Handle iframe source change dynamically
  useEffect(() => {
    if (selectedMovie) {
      const actualIframeURL = `https://vidfast.pro/${searchType === "movie" ? "movie" : "tv"}/${selectedMovie.imdbID}${searchType === "series" ? `/${selectedSeason}/${selectedEpisode}` : ""}`;
      setIframeSource(actualIframeURL);  
    }
  }, [selectedSeason, selectedEpisode, selectedMovie, searchType]);

  return (
    <div className="container">
      <h1>Watchers</h1>

      {/* Search Input and Dropdown */}
      <div className="search-container">
        <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} className="dropdown">
          <option value="id">Search by ID</option>
          <option value="title">Search by Title</option>
        </select>

        <input
          type="text"
          placeholder={searchBy === "id" ? "Enter Movie ID .." : "Enter Movie Title ..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-box"
        />
      </div>

      {/* Trending and Newly Released Section */}
      {!searchTerm && (
        <div className="trending-newly-released">
          <h2>Trending</h2>
          <div className="container-cards-scrollable scrollable">
            {trendingMovies.map((movie) => (
              <div key={movie.imdbID} onClick={() => handleMovieSelection(movie.imdbID)} className="Card">
                <img src={movie.Poster} alt={movie.Title} className="Card-img" />
                <h4>{movie.Title} ({movie.Year})</h4>
              </div>
            ))}
          </div>

          <h2>Newly Released</h2>
          <div className="container-cards-scrollable scrollable">
            {newlyReleasedMovies.map((movie) => (
              <div key={movie.imdbID} onClick={() => handleMovieSelection(movie.imdbID)} className="Card">
                <img src={movie.Poster} alt={movie.Title} className="Card-img" />
                <h4>{movie.Title} ({movie.Year})</h4>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Movie Selection (for title-based search) */}
      {movieData && movieData.Search && movieData.Search.length > 0 && !selectedMovie && (
        <div className="container-cards">
          {movieData.Search.map((movie) => (
            <div key={movie.imdbID} onClick={() => handleMovieSelection(movie.imdbID)} className="Card">
              <img src={movie.Poster} alt={movie.Title} className="Card-img" />
              <h4>{movie.Title} ({movie.Year})</h4>
            </div>
          ))}
        </div>
      )}

      {/* Show selected movie details */}
      {selectedMovie && (
        <div className="video-container">
          {/* Dropdown to change iframe source */}
          <select onChange={(e) => setIframeSource(e.target.value)} className="dropdown">
            <option value={iframeSource}>Vidfast</option>
            {tmdbID && (
              <option value={`https://vidlink.pro/${searchType === "movie" ? "movie" : "tv"}/${tmdbID}${searchType === "series" ? `/${selectedSeason}/${selectedEpisode}` : ""}`}>
                Vidlink</option>
            )}
            
            {tmdbID && (
              <option value={`https://nunflix.org/watch/${searchType === "movie" ? "movie" : "tv"}/${tmdbID}${searchType === "series" ? `/${selectedSeason}/${selectedEpisode}` : ""}`}>
                Nunflix</option>
            )}
            <option value={`https://vidsrc.xyz/embed/${searchType === "movie" ? "movie" : "tv"}/${tmdbID}${searchType === "series" ? `/${selectedSeason}/${selectedEpisode}` : ""}`}>
              Vidscr-1</option>
            <option value={`https://vidsrc.to/embed/${searchType === "movie" ? "movie" : "tv"}/${tmdbID}${searchType === "series" ? `/${selectedSeason}/${selectedEpisode}` : ""}`}>
              Vidscr-2</option>
          </select>

          <iframe
            src={iframeSource}
            left="0"
            width="1300px"  // Adjust width for responsiveness
            height="800px"
            frameBorder="0"
            allowFullScreen
            title="Movie Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture fullscreen"
            loading="lazy"
            className="video-player"
            placeholder={searchBy === "id" ? "Enter Movie ID .." : "Enter Movie Title ..."}
            //sandbox={iframeSource.includes("https://nunflix.org/watch") ? "allow-same-origin allow-scripts" : undefined}
            style={{ borderRadius: "10px", marginTop: "20px" }}
          ></iframe>
        </div>
      )}

      {/* If it's a series or anime, show season and episode selection */}
      {selectedMovie && (selectedMovie.Type === "series" || selectedMovie.Type === "anime") && (
        <div className="season-episode-selector">
          <div className="season-selector">
            <h3>Select Season</h3>
            <select onChange={(e) => handleSeasonSelection(e.target.value)} value={selectedSeason} className="dropdown">
              {[1, 2, 3, 4, 5].map(season => (  // Assuming 5 seasons for example
                <option key={season} value={season}>Season {season}</option>
              ))}
            </select>
          </div>

          {selectedSeason && (
            <div className="episode-selector">
              <h3>Select Episode</h3>
              <select onChange={(e) => handleEpisodeSelection(e.target.value)} value={selectedEpisode} className="dropdown">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map(episode => (  // Assuming 5 episodes per season for the example
                  <option key={episode} value={episode}>Episode {episode}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
