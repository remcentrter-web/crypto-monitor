import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import './AuthModal.css';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Логіка входу
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Логіка реєстрації
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Оновлення імені в профілі Firebase
        await updateProfile(userCredential.user, { displayName: name });
      }
      
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      // Розумна розшифровка помилок Firebase
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Цей акаунт вже існує. Перейдіть у вкладку "Увійти"');
          break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Неправильна пошта або пароль');
          break;
        case 'auth/weak-password':
          setError('Пароль занадто слабкий (мінімум 6 символів)');
          break;
        case 'auth/invalid-email':
          setError('Неправильний формат електронної пошти');
          break;
        default:
          setError('Помилка: перевірте дані або спробуйте пізніше');
      }
      console.error("Firebase Auth Error:", err.code);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>
        
        <h2>{isLogin ? 'Вхід в систему' : 'Реєстрація'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Введіть свої дані для доступу' : 'Створіть новий обліковий запис'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Ваше ім'я" 
              value={name} 
              onChange={(e) => {
                // Забороняємо цифри та спецсимволи (+, -, *, / тощо)
                const cleanName = e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]/g, '');
                setName(cleanName);
              }} 
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => {
              // Забороняємо пробіли та дивні символи в пошті
              const cleanEmail = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
              setEmail(cleanEmail);
            }} 
            required 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? 'Немає акаунту?' : 'Вже маєте акаунт?'}
          <span onClick={() => {
            setIsLogin(!isLogin);
            setError(''); // Очищуємо помилку при перемиканні
          }}>
            {isLogin ? ' Створити' : ' Увійти'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;