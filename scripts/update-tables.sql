-- Добавляем таблицу для кризисных контактов
CREATE TABLE IF NOT EXISTS crisis_contacts (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(50),
    sms_number VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем данные по умолчанию
INSERT INTO crisis_contacts (country_code, country_name, phone_number, sms_number, description) VALUES
('US', 'United States', '988', '741741', 'National Suicide Prevention Lifeline'),
('UK', 'United Kingdom', '116 123', NULL, 'Samaritans'),
('CA', 'Canada', '1-833-456-4566', '45645', 'Talk Suicide Canada'),
('AU', 'Australia', '13 11 14', NULL, 'Lifeline Australia'),
('DE', 'Germany', '0800 111 0 111', NULL, 'Telefonseelsorge'),
('FR', 'France', '3114', NULL, 'Numéro national français de prévention du suicide')
ON CONFLICT DO NOTHING;

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_crisis_contacts_country ON crisis_contacts(country_code);
CREATE INDEX IF NOT EXISTS idx_crisis_contacts_active ON crisis_contacts(is_active);
