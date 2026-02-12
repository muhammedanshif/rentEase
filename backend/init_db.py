from app import app, db, User, Building, Room, EmergencyContact, PaymentSettings
from werkzeug.security import generate_password_hash

with app.app_context():
    print("Creating database tables...")
    db.create_all()
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        print("Creating admin user...")
        db.session.add(User(username='admin',email='admin@rental.com',password_hash=generate_password_hash('admin123'),role='admin'))
        print("Adding emergency contacts...")
        for s in [{'service_type':'Police','phone_number':'100'},{'service_type':'Fire','phone_number':'101'},{'service_type':'Ambulance','phone_number':'102'},{'service_type':'Electrician','contact_name':'Local Electrician','phone_number':'9876543210'},{'service_type':'Plumber','contact_name':'Local Plumber','phone_number':'9876543211'}]:
            db.session.add(EmergencyContact(**s))
        print("Creating payment settings...")
        db.session.add(PaymentSettings(upi_id=None,upi_qr_code=None))
        db.session.commit()
        print("=" * 50)
        print("Database initialized successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("=" * 50)
    else:
        print("Admin already exists | Username: admin | Password: admin123")
