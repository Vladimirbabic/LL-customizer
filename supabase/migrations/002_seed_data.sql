-- Seed data for development/demo purposes

-- Insert sample templates
INSERT INTO templates (id, name, description, html_content, thumbnail_url, is_active) VALUES
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Real Estate Listing - Modern',
  'A clean, modern template for real estate property listings with hero image and key details.',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{property_title}} | {{agent_name}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
    .hero { position: relative; height: 60vh; min-height: 400px; }
    .hero img { width: 100%; height: 100%; object-fit: cover; }
    .hero-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 2rem; color: white; }
    .price { font-size: 2.5rem; font-weight: bold; color: {{accent_color}}; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
    .detail-card { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; text-align: center; }
    .detail-card h3 { font-size: 0.875rem; color: #666; text-transform: uppercase; margin-bottom: 0.5rem; }
    .detail-card p { font-size: 1.5rem; font-weight: bold; color: {{accent_color}}; }
    .description { margin: 2rem 0; }
    .description h2 { margin-bottom: 1rem; color: #1a1a1a; }
    .agent-card { display: flex; align-items: center; gap: 1.5rem; background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; }
    .agent-card img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
    .agent-info h3 { margin-bottom: 0.25rem; }
    .agent-info p { color: #666; }
    .cta-button { display: inline-block; background: {{accent_color}}; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 1rem; }
    .cta-button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 2rem; background: #1a1a1a; color: white; margin-top: 3rem; }
  </style>
</head>
<body>
  <div class="hero">
    <img src="{{hero_image}}" alt="{{property_title}}">
    <div class="hero-overlay">
      <p class="price">{{price}}</p>
      <h1>{{property_title}}</h1>
      <p>{{address}}</p>
    </div>
  </div>

  <div class="container">
    <div class="details-grid">
      <div class="detail-card">
        <h3>Bedrooms</h3>
        <p>{{bedrooms}}</p>
      </div>
      <div class="detail-card">
        <h3>Bathrooms</h3>
        <p>{{bathrooms}}</p>
      </div>
      <div class="detail-card">
        <h3>Square Feet</h3>
        <p>{{square_feet}}</p>
      </div>
      <div class="detail-card">
        <h3>Year Built</h3>
        <p>{{year_built}}</p>
      </div>
    </div>

    <div class="description">
      <h2>About This Property</h2>
      <p>{{description}}</p>
    </div>

    <div class="agent-card">
      <img src="{{agent_photo}}" alt="{{agent_name}}">
      <div class="agent-info">
        <h3>{{agent_name}}</h3>
        <p>{{agent_title}}</p>
        <p>{{agent_phone}} | {{agent_email}}</p>
        <a href="mailto:{{agent_email}}" class="cta-button">Contact Agent</a>
      </div>
    </div>
  </div>

  <footer class="footer">
    <p>{{company_name}} | {{company_phone}}</p>
  </footer>
</body>
</html>',
  '/templates/real-estate-modern.jpg',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Real Estate Listing - Classic',
  'A traditional, elegant template perfect for luxury property listings.',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{property_title}} | {{agent_name}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; line-height: 1.8; color: #2c2c2c; background: #faf9f7; }
    header { background: {{primary_color}}; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 1.25rem; font-weight: normal; }
    .gallery { display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem; height: 500px; }
    .gallery img { width: 100%; height: 100%; object-fit: cover; }
    .gallery-main { grid-row: span 2; }
    .content { max-width: 1000px; margin: 0 auto; padding: 3rem 2rem; }
    .price-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid {{primary_color}}; padding-bottom: 1rem; margin-bottom: 2rem; }
    .price { font-size: 2rem; color: {{primary_color}}; }
    .address { color: #666; }
    .features { display: flex; gap: 3rem; margin: 2rem 0; padding: 1.5rem; background: white; border: 1px solid #e5e5e5; }
    .feature { text-align: center; }
    .feature-value { font-size: 1.5rem; color: {{primary_color}}; display: block; }
    .feature-label { font-size: 0.875rem; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .description { margin: 2rem 0; }
    .description h2 { font-size: 1.5rem; margin-bottom: 1rem; color: {{primary_color}}; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.5rem; }
    .agent-section { background: white; padding: 2rem; border: 1px solid #e5e5e5; display: flex; gap: 2rem; align-items: center; }
    .agent-section img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid {{primary_color}}; }
    .contact-btn { display: inline-block; background: {{primary_color}}; color: white; padding: 0.75rem 1.5rem; text-decoration: none; margin-top: 1rem; }
    footer { background: #2c2c2c; color: white; text-align: center; padding: 2rem; margin-top: 3rem; }
  </style>
</head>
<body>
  <header>
    <h1>{{company_name}}</h1>
    <span>{{company_phone}}</span>
  </header>

  <div class="gallery">
    <img class="gallery-main" src="{{hero_image}}" alt="{{property_title}}">
    <img src="{{gallery_image_1}}" alt="Interior">
    <img src="{{gallery_image_2}}" alt="Interior">
  </div>

  <div class="content">
    <div class="price-bar">
      <div>
        <p class="price">{{price}}</p>
        <p class="address">{{address}}</p>
      </div>
      <h2>{{property_title}}</h2>
    </div>

    <div class="features">
      <div class="feature">
        <span class="feature-value">{{bedrooms}}</span>
        <span class="feature-label">Bedrooms</span>
      </div>
      <div class="feature">
        <span class="feature-value">{{bathrooms}}</span>
        <span class="feature-label">Bathrooms</span>
      </div>
      <div class="feature">
        <span class="feature-value">{{square_feet}}</span>
        <span class="feature-label">Sq. Ft.</span>
      </div>
      <div class="feature">
        <span class="feature-value">{{lot_size}}</span>
        <span class="feature-label">Lot Size</span>
      </div>
    </div>

    <div class="description">
      <h2>Property Description</h2>
      <p>{{description}}</p>
    </div>

    <div class="agent-section">
      <img src="{{agent_photo}}" alt="{{agent_name}}">
      <div>
        <h3>{{agent_name}}</h3>
        <p>{{agent_title}}</p>
        <p>{{agent_phone}}</p>
        <p>{{agent_email}}</p>
        <a href="tel:{{agent_phone}}" class="contact-btn">Schedule a Showing</a>
      </div>
    </div>
  </div>

  <footer>
    <p>{{company_name}} &copy; 2024</p>
  </footer>
</body>
</html>',
  '/templates/real-estate-classic.jpg',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Open House Invitation',
  'An attractive invitation template for open house events.',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open House | {{property_address}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5; }
    .invitation { max-width: 600px; margin: 2rem auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: {{theme_color}}; color: white; padding: 2rem; text-align: center; }
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .header p { opacity: 0.9; }
    .hero-image { width: 100%; height: 300px; object-fit: cover; }
    .content { padding: 2rem; }
    .event-details { background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; }
    .event-details h2 { color: {{theme_color}}; margin-bottom: 1rem; }
    .detail-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
    .detail-row svg { width: 20px; height: 20px; color: {{theme_color}}; }
    .property-highlights { margin: 1.5rem 0; }
    .property-highlights h3 { margin-bottom: 1rem; }
    .highlights-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .highlight { display: flex; align-items: center; gap: 0.5rem; }
    .highlight-dot { width: 8px; height: 8px; background: {{theme_color}}; border-radius: 50%; }
    .price-banner { background: {{theme_color}}; color: white; text-align: center; padding: 1rem; font-size: 1.5rem; font-weight: bold; }
    .agent-info { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; border-top: 1px solid #eee; }
    .agent-info img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; }
    .rsvp-btn { display: block; background: {{theme_color}}; color: white; text-align: center; padding: 1rem; text-decoration: none; font-weight: bold; margin: 1rem; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="invitation">
    <div class="header">
      <p>You are Invited to an</p>
      <h1>OPEN HOUSE</h1>
    </div>

    <img class="hero-image" src="{{property_image}}" alt="Property">

    <div class="content">
      <div class="event-details">
        <h2>Event Details</h2>
        <div class="detail-row">
          <span>{{event_date}}</span>
        </div>
        <div class="detail-row">
          <span>{{event_time}}</span>
        </div>
        <div class="detail-row">
          <span>{{property_address}}</span>
        </div>
      </div>

      <div class="property-highlights">
        <h3>Property Highlights</h3>
        <div class="highlights-grid">
          <div class="highlight"><span class="highlight-dot"></span> {{bedrooms}} Bedrooms</div>
          <div class="highlight"><span class="highlight-dot"></span> {{bathrooms}} Bathrooms</div>
          <div class="highlight"><span class="highlight-dot"></span> {{square_feet}} Sq Ft</div>
          <div class="highlight"><span class="highlight-dot"></span> {{special_feature}}</div>
        </div>
      </div>
    </div>

    <div class="price-banner">Listed at {{price}}</div>

    <div class="agent-info">
      <img src="{{agent_photo}}" alt="{{agent_name}}">
      <div>
        <strong>{{agent_name}}</strong>
        <p>{{agent_phone}}</p>
      </div>
    </div>

    <a href="mailto:{{agent_email}}?subject=RSVP for Open House at {{property_address}}" class="rsvp-btn">RSVP Now</a>
  </div>
</body>
</html>',
  '/templates/open-house.jpg',
  true
);

-- Insert template fields for Real Estate Listing - Modern
INSERT INTO template_fields (template_id, field_key, field_type, label, placeholder, default_value, is_required, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'property_title', 'text', 'Property Title', 'e.g., Stunning Modern Home', NULL, true, 1),
('550e8400-e29b-41d4-a716-446655440001', 'address', 'text', 'Property Address', '123 Main St, City, State 12345', NULL, true, 2),
('550e8400-e29b-41d4-a716-446655440001', 'price', 'text', 'Price', '$750,000', NULL, true, 3),
('550e8400-e29b-41d4-a716-446655440001', 'hero_image', 'image', 'Hero Image', NULL, 'https://placehold.co/1200x800/e2e8f0/64748b?text=Property+Image', true, 4),
('550e8400-e29b-41d4-a716-446655440001', 'bedrooms', 'select', 'Bedrooms', NULL, '3', true, 5),
('550e8400-e29b-41d4-a716-446655440001', 'bathrooms', 'select', 'Bathrooms', NULL, '2', true, 6),
('550e8400-e29b-41d4-a716-446655440001', 'square_feet', 'text', 'Square Feet', '2,500', NULL, true, 7),
('550e8400-e29b-41d4-a716-446655440001', 'year_built', 'text', 'Year Built', '2020', NULL, false, 8),
('550e8400-e29b-41d4-a716-446655440001', 'description', 'textarea', 'Property Description', 'Describe the property features and highlights...', NULL, true, 9),
('550e8400-e29b-41d4-a716-446655440001', 'accent_color', 'color', 'Accent Color', NULL, '#2563eb', false, 10),
('550e8400-e29b-41d4-a716-446655440001', 'agent_name', 'text', 'Agent Name', 'John Smith', NULL, true, 11),
('550e8400-e29b-41d4-a716-446655440001', 'agent_title', 'text', 'Agent Title', 'Senior Real Estate Agent', NULL, false, 12),
('550e8400-e29b-41d4-a716-446655440001', 'agent_phone', 'phone', 'Agent Phone', '(555) 123-4567', NULL, true, 13),
('550e8400-e29b-41d4-a716-446655440001', 'agent_email', 'email', 'Agent Email', 'agent@example.com', NULL, true, 14),
('550e8400-e29b-41d4-a716-446655440001', 'agent_photo', 'image', 'Agent Photo', NULL, 'https://placehold.co/200x200/e2e8f0/64748b?text=Agent', false, 15),
('550e8400-e29b-41d4-a716-446655440001', 'company_name', 'text', 'Company Name', 'ABC Realty', NULL, true, 16),
('550e8400-e29b-41d4-a716-446655440001', 'company_phone', 'phone', 'Company Phone', '(555) 000-0000', NULL, false, 17);

-- Update select field options
UPDATE template_fields
SET options = '[{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}, {"label": "6+", "value": "6+"}]'::jsonb
WHERE field_key = 'bedrooms' AND template_id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE template_fields
SET options = '[{"label": "1", "value": "1"}, {"label": "1.5", "value": "1.5"}, {"label": "2", "value": "2"}, {"label": "2.5", "value": "2.5"}, {"label": "3", "value": "3"}, {"label": "3.5", "value": "3.5"}, {"label": "4+", "value": "4+"}]'::jsonb
WHERE field_key = 'bathrooms' AND template_id = '550e8400-e29b-41d4-a716-446655440001';

-- Insert template fields for Real Estate Listing - Classic
INSERT INTO template_fields (template_id, field_key, field_type, label, placeholder, default_value, is_required, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'property_title', 'text', 'Property Title', 'e.g., Elegant Victorian Estate', NULL, true, 1),
('550e8400-e29b-41d4-a716-446655440002', 'address', 'text', 'Property Address', '123 Main St, City, State 12345', NULL, true, 2),
('550e8400-e29b-41d4-a716-446655440002', 'price', 'text', 'Price', '$1,250,000', NULL, true, 3),
('550e8400-e29b-41d4-a716-446655440002', 'hero_image', 'image', 'Main Property Image', NULL, 'https://placehold.co/800x600/e2e8f0/64748b?text=Main+Image', true, 4),
('550e8400-e29b-41d4-a716-446655440002', 'gallery_image_1', 'image', 'Gallery Image 1', NULL, 'https://placehold.co/400x300/e2e8f0/64748b?text=Gallery+1', false, 5),
('550e8400-e29b-41d4-a716-446655440002', 'gallery_image_2', 'image', 'Gallery Image 2', NULL, 'https://placehold.co/400x300/e2e8f0/64748b?text=Gallery+2', false, 6),
('550e8400-e29b-41d4-a716-446655440002', 'bedrooms', 'select', 'Bedrooms', NULL, '4', true, 7),
('550e8400-e29b-41d4-a716-446655440002', 'bathrooms', 'select', 'Bathrooms', NULL, '3', true, 8),
('550e8400-e29b-41d4-a716-446655440002', 'square_feet', 'text', 'Square Feet', '3,500', NULL, true, 9),
('550e8400-e29b-41d4-a716-446655440002', 'lot_size', 'text', 'Lot Size', '0.5 Acres', NULL, false, 10),
('550e8400-e29b-41d4-a716-446655440002', 'description', 'textarea', 'Property Description', 'Describe the property features and highlights...', NULL, true, 11),
('550e8400-e29b-41d4-a716-446655440002', 'primary_color', 'color', 'Primary Color', NULL, '#1e3a5f', false, 12),
('550e8400-e29b-41d4-a716-446655440002', 'agent_name', 'text', 'Agent Name', 'Jane Doe', NULL, true, 13),
('550e8400-e29b-41d4-a716-446655440002', 'agent_title', 'text', 'Agent Title', 'Luxury Property Specialist', NULL, false, 14),
('550e8400-e29b-41d4-a716-446655440002', 'agent_phone', 'phone', 'Agent Phone', '(555) 123-4567', NULL, true, 15),
('550e8400-e29b-41d4-a716-446655440002', 'agent_email', 'email', 'Agent Email', 'agent@example.com', NULL, true, 16),
('550e8400-e29b-41d4-a716-446655440002', 'agent_photo', 'image', 'Agent Photo', NULL, 'https://placehold.co/200x200/e2e8f0/64748b?text=Agent', false, 17),
('550e8400-e29b-41d4-a716-446655440002', 'company_name', 'text', 'Company Name', 'Premier Estates', NULL, true, 18),
('550e8400-e29b-41d4-a716-446655440002', 'company_phone', 'phone', 'Company Phone', '(555) 000-0000', NULL, false, 19);

-- Update select field options for Classic template
UPDATE template_fields
SET options = '[{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}, {"label": "6+", "value": "6+"}]'::jsonb
WHERE field_key = 'bedrooms' AND template_id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE template_fields
SET options = '[{"label": "1", "value": "1"}, {"label": "1.5", "value": "1.5"}, {"label": "2", "value": "2"}, {"label": "2.5", "value": "2.5"}, {"label": "3", "value": "3"}, {"label": "3.5", "value": "3.5"}, {"label": "4+", "value": "4+"}]'::jsonb
WHERE field_key = 'bathrooms' AND template_id = '550e8400-e29b-41d4-a716-446655440002';

-- Insert template fields for Open House Invitation
INSERT INTO template_fields (template_id, field_key, field_type, label, placeholder, default_value, is_required, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'property_address', 'text', 'Property Address', '123 Main St, City, State', NULL, true, 1),
('550e8400-e29b-41d4-a716-446655440003', 'event_date', 'text', 'Event Date', 'Saturday, January 15, 2025', NULL, true, 2),
('550e8400-e29b-41d4-a716-446655440003', 'event_time', 'text', 'Event Time', '1:00 PM - 4:00 PM', NULL, true, 3),
('550e8400-e29b-41d4-a716-446655440003', 'property_image', 'image', 'Property Image', NULL, 'https://placehold.co/600x400/e2e8f0/64748b?text=Property', true, 4),
('550e8400-e29b-41d4-a716-446655440003', 'price', 'text', 'Price', '$599,000', NULL, true, 5),
('550e8400-e29b-41d4-a716-446655440003', 'bedrooms', 'select', 'Bedrooms', NULL, '3', true, 6),
('550e8400-e29b-41d4-a716-446655440003', 'bathrooms', 'select', 'Bathrooms', NULL, '2', true, 7),
('550e8400-e29b-41d4-a716-446655440003', 'square_feet', 'text', 'Square Feet', '2,200', NULL, true, 8),
('550e8400-e29b-41d4-a716-446655440003', 'special_feature', 'text', 'Special Feature', 'Updated Kitchen', NULL, false, 9),
('550e8400-e29b-41d4-a716-446655440003', 'theme_color', 'color', 'Theme Color', NULL, '#059669', false, 10),
('550e8400-e29b-41d4-a716-446655440003', 'agent_name', 'text', 'Agent Name', 'Agent Name', NULL, true, 11),
('550e8400-e29b-41d4-a716-446655440003', 'agent_phone', 'phone', 'Agent Phone', '(555) 123-4567', NULL, true, 12),
('550e8400-e29b-41d4-a716-446655440003', 'agent_email', 'email', 'Agent Email', 'agent@example.com', NULL, true, 13),
('550e8400-e29b-41d4-a716-446655440003', 'agent_photo', 'image', 'Agent Photo', NULL, 'https://placehold.co/100x100/e2e8f0/64748b?text=Agent', false, 14);

-- Update select field options for Open House template
UPDATE template_fields
SET options = '[{"label": "1", "value": "1"}, {"label": "2", "value": "2"}, {"label": "3", "value": "3"}, {"label": "4", "value": "4"}, {"label": "5", "value": "5"}, {"label": "6+", "value": "6+"}]'::jsonb
WHERE field_key = 'bedrooms' AND template_id = '550e8400-e29b-41d4-a716-446655440003';

UPDATE template_fields
SET options = '[{"label": "1", "value": "1"}, {"label": "1.5", "value": "1.5"}, {"label": "2", "value": "2"}, {"label": "2.5", "value": "2.5"}, {"label": "3", "value": "3"}, {"label": "3.5", "value": "3.5"}, {"label": "4+", "value": "4+"}]'::jsonb
WHERE field_key = 'bathrooms' AND template_id = '550e8400-e29b-41d4-a716-446655440003';
