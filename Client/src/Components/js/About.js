import '../css/About.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import farmBgImg from '../../assets/images/bgimg.png';

const features = [
    { icon: 'fa-seedling',      label: '100% Organic',        sub: 'Chemical-free farming' },
    { icon: 'fa-leaf',          label: 'Sustainably Grown',   sub: 'Good for soil, good for future' },
    { icon: 'fa-heart',         label: 'Healthy & Natural',   sub: 'No additives, no preservatives' },
    { icon: 'fa-people-group',  label: 'Supporting Farmers',  sub: 'Empowering local organic farmers' },
    { icon: 'fa-shield-halved', label: 'Pure & Honest',       sub: 'What you see is what you get' },
];

export default function About() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/products`)
            .then(res => res.json())
            .then(data => setProducts(data.products || []))
            .catch(err => console.error('Failed to load products:', err));
    }, []);

    return (
        <div className="about_page">

            {/* Hero */}
            <section className="about_hero" style={{ '--farm-bg': `url(${farmBgImg})` }}>
                <div className="about_hero_overlay">
                    <div className="about_hero_text">
                        <h1>About Us</h1>
                        <div className="about_hero_divider"><span className="about_leaf_icon">🌿</span></div>
                        <p className="about_hero_tagline">Rooted in Nature. Committed to Health.</p>
                        <p><strong>Amudhootru Organics</strong> is an organic store and a proud organic farmer's brand, dedicated to bringing you the purest, healthiest and most natural edible products.</p>
                        <p>We believe that <strong>healthy soil grows healthy food, and healthy food builds a healthy life.</strong></p>
                    </div>
                </div>
            </section>

            {/* From Our Farms */}
            <section className="about_farms">
                <h2>From Our Farms to Your Family</h2>
                <div className="about_leaf_divider">🌿</div>
                <p className="about_farms_desc">
                    We are farmers first. Our journey begins in our organic farms where we follow traditional and
                    sustainable farming practices. We grow with care, without harmful chemicals or pesticides,
                    respecting nature and nurturing the environment.
                </p>
                <div className="about_features">
                    {features.map(f => (
                        <div className="about_feature_card" key={f.label}>
                            <div className="about_feature_icon_wrap">
                                <i className={`fa-solid ${f.icon} about_feature_icon`}></i>
                            </div>
                            <p className="about_feature_label">{f.label}</p>
                            <p className="about_feature_sub">{f.sub}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Our Products */}
            <section className="about_products">
                <h2>Our Organic Products</h2>
                <div className="about_leaf_divider">🌿</div>
                <p className="about_products_desc">
                    We offer a handpicked range of organic and natural products, directly from our farms to your home.
                </p>
                <div className="about_products_grid">
                    {products.map(p => (
                        <div className="about_product_card" key={p.code ?? p.id}>
                            <div className="about_product_img_wrap">
                                {p.img_src
                                    ? <img src={p.img_src} alt={p.name} className="about_product_img" />
                                    : <div className="about_product_img_placeholder"><i className="fa-solid fa-jar about_honey_icon"></i></div>
                                }
                            </div>
                            <p className="about_product_name">{p.name}</p>
                            <p className="about_product_desc">{p.description}</p>
                        </div>
                    ))}
                </div>
                <button className="about_shop_btn" onClick={() => navigate('/')}>Shop Now</button>
            </section>

            {/* Mission & Vision */}
            <section className="about_mv" style={{ backgroundImage: `url(${farmBgImg})` }}>
                <div className="about_mv_overlay">
                    <div className="about_mv_quote">
                        <p className="about_mv_italic">"Organic farming serves healthy products for a healthy tomorrow."</p>
                        <div className="about_leaf_divider about_leaf_white">🌿</div>
                    </div>
                    <div className="about_mv_cards">
                        <div className="about_mv_card">
                            <h3>Our Mission</h3>
                            <i className="fa-solid fa-hand-holding-heart about_mv_icon"></i>
                            <p>To promote organic living by providing pure, chemical-free and nutritious products while supporting sustainable farming and empowering our farmers.</p>
                        </div>
                        <div className="about_mv_card">
                            <h3>Our Vision</h3>
                            <i className="fa-solid fa-globe about_mv_icon"></i>
                            <p>To be a trusted organic brand that connects farmers and families through honesty, quality and care for a healthier world.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer bar */}
            <div className="about_footer_bar">
                <span className="about_leaf_icon">🌿</span>
                <span>Amudhootru Organics – Grown by Farmers, Served with Love.</span>
            </div>

        </div>
    );
}
