    import React, { useState } from 'react';
    import './CoinModal.css';

    const CoinModal = ({ coinId, data, onClose }) => {
    const [usdAmount, setUsdAmount] = useState('');

    if (!coinId) return null;

    // Визначаємо курс долара (можна змінити на актуальний)
    const USD_TO_UAH = 40.20;

    const isPositive = parseFloat(data?.change) >= 0;
    const priceColor = isPositive ? '#2ebd85' : '#f6465d';

    // Розрахунок крипти
    const cryptoAmount = usdAmount && data?.price 
        ? (parseFloat(usdAmount) / parseFloat(data.price.replace('$', '').replace(',', ''))).toFixed(6)
        : '0.00';

    // Розрахунок у гривнях
    const uahAmount = usdAmount 
        ? (parseFloat(usdAmount) * USD_TO_UAH).toLocaleString()
        : '0';

    return (
        <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={onClose}>&times;</button>
            
            <div className="modal-header">
            <img 
                src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${coinId.toLowerCase()}.png`}
                alt={coinId}
                className="modal-icon"
            />
            <h2>{coinId} ДЕТАЛІ</h2>
            </div>

            <div className="modal-price-info">
            <p className="modal-current-price" style={{ color: priceColor }}>
                {data?.price || '...'}
            </p>
            {data?.change && (
                <span className={`modal-change ${isPositive ? 'up' : 'down'}`}>
                {isPositive ? '▲' : '▼'} {data.change}%
                </span>
            )}
            </div>

            <div className="calculator-section">
            <h3>Калькулятор</h3>
            <div className="calc-input-group">
               <input 
              type="number" 
              placeholder="Введіть суму в USD" 
              value={usdAmount}
              min="0" 
              onChange={(e) => {
                const value = e.target.value;
                if (value >= 0 || value === '') {
                  setUsdAmount(value);
                }
              }}
            />
                <span className="currency-label">USD</span>
            </div>
            
            <div className="calc-results-container">
                <p className="calc-result">
                Ви отримаєте: <strong>{cryptoAmount} {coinId}</strong>
                </p>
                <p className="calc-result uah-style">
                В гривнях (UAH): <strong>~{uahAmount} ₴</strong>
                </p>
            </div>
            </div>
        </div>
        </div>
    );
    };

    export default CoinModal;