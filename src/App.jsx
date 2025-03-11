import React, { useCallback, useEffect, useState } from 'react'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer ' + API_KEY,
  }
}

const App = () => {

  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendErrorMesage, setTrendErrorMessage] = useState('');

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  console.log('Rendered');

  const fetchMovies = useCallback(async (query) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const url = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const res = await fetch(url, API_OPTIONS);

      if (!res.ok) {
        throw new Error('Failed to fetch movies');
      }

      const json = await res.json();

      if (json.Response === 'False') {
        setErrorMessage(json.Error || 'Failed to fetch movies');
        setMovies([]);
        return;
      }
      setMovies(json.results || []);

      if (query && json.results.length > 0) {
        await updateSearchCount(query, json.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies.  Please try again later.');
    } finally {
      setIsLoading(false);
    }

  }, []);

  const loadTrendingMovies = useCallback(async () => {
    setTrendErrorMessage('');
    setIsTrendLoading(true);
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (e) {
      console.log(`Error fetching trending movies: ${e}`);
      setTrendErrorMessage(`Error fetching trending movies: ${e}`);
    } finally {
      setIsTrendLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrendingMovies();
  }, [loadTrendingMovies]);

  useEffect(() => {

    fetchMovies(debouncedSearchTerm);

  }, [fetchMovies, debouncedSearchTerm]);

  return (
    <main>
      <div className='pattern' />

      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="hero banner" />
          <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {isTrendLoading ? (
          <Spinner />
        ) : trendErrorMesage ? (
          <p className='text-red-500'>{trendErrorMesage}</p>
        ) : (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>


      </div>
    </main>
  )
}

export default App