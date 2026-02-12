from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from functools import wraps
import jwt
import os
import uuid
import razorpay
from flask_mail import Mail, Message

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
database_url = os.environ.get('DATABASE_URL', 'sqlite:///rental_management.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Mail Config
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', 'your-app-password')
app.config['MAIL_DEFAULT_SENDER'] = ('RentEase', app.config['MAIL_USERNAME'])

# Razorpay Config
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'secret_placeholder')

try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except:
    razorpay_client = None

mail = Mail(app)

db = SQLAlchemy(app)
CORS(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'tenant_docs'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'tenant_photos'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'room_photos'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'payment_screenshots'), exist_ok=True)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'admin' or 'tenant'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tenant = db.relationship('Tenant', backref='user', uselist=False, cascade='all, delete-orphan')

class Building(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.Text, nullable=False)
    total_floors = db.Column(db.Integer)
    building_type = db.Column(db.String(50))  # 'commercial', 'residential', 'mixed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    rooms = db.relationship('Room', backref='building', cascade='all, delete-orphan')

class Room(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    building_id = db.Column(db.Integer, db.ForeignKey('building.id'), nullable=False)
    room_number = db.Column(db.String(50), nullable=False)
    room_type = db.Column(db.String(50), nullable=False)  # '1BHK', '2BHK', '3BHK', 'Shop', 'Office'
    floor_number = db.Column(db.Integer)
    area_sqft = db.Column(db.Float)
    rent_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='vacant')  # 'vacant', 'occupied'
    category = db.Column(db.String(20))  # 'residential', 'commercial'
    photos = db.Column(db.Text)  # JSON string of photo paths
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tenant = db.relationship('Tenant', backref='room', uselist=False, cascade='all, delete-orphan')

class Tenant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'))
    full_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    id_proof_type = db.Column(db.String(50))
    id_proof_number = db.Column(db.String(100))
    photo_path = db.Column(db.String(255))
    documents = db.Column(db.Text)  # JSON string of document paths
    lease_start_date = db.Column(db.Date)
    lease_end_date = db.Column(db.Date)
    deposit_amount = db.Column(db.Float)
    emergency_contact_name = db.Column(db.String(200))
    emergency_contact_phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bills = db.relationship('Bill', backref='tenant', cascade='all, delete-orphan')
    complaints = db.relationship('Complaint', backref='tenant', cascade='all, delete-orphan')

class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=False)
    bill_type = db.Column(db.String(50), nullable=False)  # 'rent', 'electricity', 'water', 'maintenance'
    amount = db.Column(db.Float, nullable=False)
    billing_month = db.Column(db.String(20))  # 'YYYY-MM'
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'paid', 'overdue'
    payment_screenshot = db.Column(db.String(255))  # Path to payment screenshot
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PaymentSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    upi_id = db.Column(db.String(100))
    upi_qr_code = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))  # 'maintenance', 'plumbing', 'electrical', 'other'
    status = db.Column(db.String(20), default='open')  # 'open', 'in_progress', 'resolved', 'closed'
    admin_reply = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmergencyContact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_type = db.Column(db.String(50), nullable=False)  # 'police', 'fire', 'electrician', etc.
    contact_name = db.Column(db.String(200))
    phone_number = db.Column(db.String(20), nullable=False)
    alternate_phone = db.Column(db.String(20))
    available_24x7 = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Announcement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'urgent'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# JWT Token decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role=data.get('role', 'tenant')
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

# Building Routes
@app.route('/api/buildings', methods=['GET'])
@token_required
def get_buildings(current_user):
    buildings = Building.query.all()
    return jsonify([{
        'id': b.id,
        'name': b.name,
        'address': b.address,
        'total_floors': b.total_floors,
        'building_type': b.building_type,
        'room_count': len(b.rooms)
    } for b in buildings])

@app.route('/api/buildings', methods=['POST'])
@token_required
@admin_required
def create_building(current_user):
    data = request.json
    building = Building(
        name=data['name'],
        address=data['address'],
        total_floors=data.get('total_floors'),
        building_type=data.get('building_type', 'residential')
    )
    db.session.add(building)
    db.session.commit()
    return jsonify({'message': 'Building created', 'id': building.id}), 201

@app.route('/api/buildings/<int:building_id>', methods=['PUT'])
@token_required
@admin_required
def update_building(current_user, building_id):
    building = Building.query.get_or_404(building_id)
    data = request.json
    building.name = data.get('name', building.name)
    building.address = data.get('address', building.address)
    building.total_floors = data.get('total_floors', building.total_floors)
    building.building_type = data.get('building_type', building.building_type)
    db.session.commit()
    return jsonify({'message': 'Building updated'})

@app.route('/api/buildings/<int:building_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_building(current_user, building_id):
    building = Building.query.get_or_404(building_id)
    db.session.delete(building)
    db.session.commit()
    return jsonify({'message': 'Building deleted'})

# Room Routes
@app.route('/api/rooms', methods=['GET'])
@token_required
def get_rooms(current_user):
    building_id = request.args.get('building_id')
    if building_id:
        rooms = Room.query.filter_by(building_id=building_id).all()
    else:
        rooms = Room.query.all()
    
    return jsonify([{
        'id': r.id,
        'building_id': r.building_id,
        'building_name': r.building.name,
        'room_number': r.room_number,
        'room_type': r.room_type,
        'floor_number': r.floor_number,
        'area_sqft': r.area_sqft,
        'rent_amount': r.rent_amount,
        'status': r.status,
        'category': r.category,
        'photos': r.photos,
        'description': r.description,
        'tenant_name': r.tenant.full_name if r.tenant else None
    } for r in rooms])

@app.route('/api/rooms', methods=['POST'])
@token_required
@admin_required
def create_room(current_user):
    data = request.json
    
    # Handle empty strings for numeric fields
    floor_number = data.get('floor_number')
    if floor_number == '':
        floor_number = None
    
    area_sqft = data.get('area_sqft')
    if area_sqft == '':
        area_sqft = None
    
    room = Room(
        building_id=data['building_id'],
        room_number=data['room_number'],
        room_type=data['room_type'],
        floor_number=floor_number,
        area_sqft=area_sqft,
        rent_amount=data['rent_amount'],
        category=data.get('category', 'residential'),
        description=data.get('description')
    )
    db.session.add(room)
    db.session.commit()
    return jsonify({'message': 'Room created', 'id': room.id}), 201

@app.route('/api/rooms/<int:room_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_room(current_user, room_id):
    room = Room.query.get_or_404(room_id)
    
    # Check if room is occupied
    if room.status == 'occupied' and room.tenant:
        return jsonify({'message': 'Cannot delete occupied room. Please remove or relocate the tenant first.'}), 400
    
    db.session.delete(room)
    db.session.commit()
    return jsonify({'message': 'Room deleted successfully'})

@app.route('/api/rooms/<int:room_id>/photos', methods=['POST'])
@token_required
@admin_required
def upload_room_photos(current_user, room_id):
    room = Room.query.get_or_404(room_id)
    if 'photos' not in request.files:
        return jsonify({'message': 'No photos provided'}), 400
    
    photos = request.files.getlist('photos')
    photo_paths = []
    
    for photo in photos:
        if photo.filename:
            filename = f"{uuid.uuid4()}_{secure_filename(photo.filename)}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'room_photos', filename)
            photo.save(filepath)
            photo_paths.append(f"room_photos/{filename}")
    
    import json
    existing_photos = json.loads(room.photos) if room.photos else []
    existing_photos.extend(photo_paths)
    room.photos = json.dumps(existing_photos)
    db.session.commit()
    
    return jsonify({'message': 'Photos uploaded', 'photos': existing_photos})

# Tenant Routes
@app.route('/api/tenants', methods=['GET'])
@token_required
def get_tenants(current_user):
    if current_user.role == 'admin':
        tenants = Tenant.query.all()
    else:
        tenants = [current_user.tenant] if current_user.tenant else []
    
    return jsonify([{
        'id': t.id,
        'full_name': t.full_name,
        'phone': t.phone,
        'email': t.email,
        'room_number': t.room.room_number if t.room else None,
        'building_name': t.room.building.name if t.room else None,
        'rent_amount': t.room.rent_amount if t.room else None,
        'lease_start_date': t.lease_start_date.isoformat() if t.lease_start_date else None,
        'lease_end_date': t.lease_end_date.isoformat() if t.lease_end_date else None,
        'deposit_amount': t.deposit_amount
    } for t in tenants])

@app.route('/api/tenants', methods=['POST'])
@token_required
@admin_required
def create_tenant(current_user):
    data = request.json
    
    # Create user account for tenant
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        role='tenant'
    )
    db.session.add(user)
    db.session.flush()
    
    # Handle empty string for deposit_amount
    deposit_amount = data.get('deposit_amount')
    if deposit_amount == '':
        deposit_amount = None
    
    tenant = Tenant(
        user_id=user.id,
        room_id=data.get('room_id'),
        full_name=data['full_name'],
        phone=data.get('phone'),
        email=data['email'],
        id_proof_type=data.get('id_proof_type'),
        id_proof_number=data.get('id_proof_number'),
        lease_start_date=datetime.fromisoformat(data['lease_start_date']) if data.get('lease_start_date') else None,
        lease_end_date=datetime.fromisoformat(data['lease_end_date']) if data.get('lease_end_date') else None,
        deposit_amount=deposit_amount,
        emergency_contact_name=data.get('emergency_contact_name'),
        emergency_contact_phone=data.get('emergency_contact_phone')
    )
    db.session.add(tenant)
    
    # Update room status
    if data.get('room_id'):
        room = Room.query.get(data['room_id'])
        if room:
            room.status = 'occupied'
    
    db.session.commit()
    return jsonify({'message': 'Tenant created', 'id': tenant.id, 'username': user.username}), 201

@app.route('/api/tenants/<int:tenant_id>/documents', methods=['POST'])
@token_required
@admin_required
def upload_tenant_documents(current_user, tenant_id):
    tenant = Tenant.query.get_or_404(tenant_id)
    files = request.files.getlist('documents')
    
    import json
    doc_paths = []
    
    for file in files:
        if file.filename:
            filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'tenant_docs', filename)
            file.save(filepath)
            doc_paths.append(f"tenant_docs/{filename}")
    
    existing_docs = json.loads(tenant.documents) if tenant.documents else []
    existing_docs.extend(doc_paths)
    tenant.documents = json.dumps(existing_docs)
    db.session.commit()
    
    return jsonify({'message': 'Documents uploaded', 'documents': existing_docs})

@app.route('/api/tenants/<int:tenant_id>/photo', methods=['POST'])
@token_required
@admin_required
def upload_tenant_photo(current_user, tenant_id):
    tenant = Tenant.query.get_or_404(tenant_id)
    if 'photo' not in request.files:
        return jsonify({'message': 'No photo provided'}), 400
    
    photo = request.files['photo']
    if photo.filename:
        filename = f"{uuid.uuid4()}_{secure_filename(photo.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'tenant_photos', filename)
        photo.save(filepath)
        tenant.photo_path = f"tenant_photos/{filename}"
        db.session.commit()
        return jsonify({'message': 'Photo uploaded', 'photo_path': tenant.photo_path})
    
    return jsonify({'message': 'Invalid photo'}), 400

@app.route('/api/tenants/<int:tenant_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_tenant(current_user, tenant_id):
    tenant = Tenant.query.get_or_404(tenant_id)
    
    # Free up the room if tenant has one
    if tenant.room_id:
        room = Room.query.get(tenant.room_id)
        if room:
            room.status = 'vacant'
    
    # Delete associated user account
    if tenant.user_id:
        user = User.query.get(tenant.user_id)
        if user:
            db.session.delete(user)
    
    # Delete tenant (bills and complaints will be cascade deleted)
    db.session.delete(tenant)
    db.session.commit()
    
    return jsonify({'message': 'Tenant deleted successfully'})

# Bill Routes
@app.route('/api/bills', methods=['GET'])
@token_required
def get_bills(current_user):
    if current_user.role == 'admin':
        tenant_id = request.args.get('tenant_id')
        if tenant_id:
            bills = Bill.query.filter_by(tenant_id=tenant_id).all()
        else:
            bills = Bill.query.all()
    else:
        if current_user.tenant:
            bills = Bill.query.filter_by(tenant_id=current_user.tenant.id).all()
        else:
            bills = []
    
    return jsonify([{
        'id': b.id,
        'tenant_id': b.tenant_id,
        'tenant_name': b.tenant.full_name,
        'bill_type': b.bill_type,
        'amount': b.amount,
        'billing_month': b.billing_month,
        'due_date': b.due_date.isoformat(),
        'paid_date': b.paid_date.isoformat() if b.paid_date else None,
        'status': b.status,
        'created_at': b.created_at.isoformat()
    } for b in bills])

@app.route('/api/bills/generate-rent', methods=['POST'])
@token_required
@admin_required
def generate_rent_bills(current_user):
    """Generate monthly rent bills for all tenants on the 1st"""
    tenants = Tenant.query.filter(Tenant.room_id.isnot(None)).all()
    bills_created = 0
    
    current_date = datetime.now()
    billing_month = current_date.strftime('%Y-%m')
    due_date = datetime(current_date.year, current_date.month, 6).date()
    
    for tenant in tenants:
        # Check if bill already exists for this month
        existing_bill = Bill.query.filter_by(
            tenant_id=tenant.id,
            bill_type='rent',
            billing_month=billing_month
        ).first()
        
        if not existing_bill and tenant.room:
            bill = Bill(
                tenant_id=tenant.id,
                bill_type='rent',
                amount=tenant.room.rent_amount,
                billing_month=billing_month,
                due_date=due_date
            )
            db.session.add(bill)
            bills_created += 1
    
    db.session.commit()
    return jsonify({'message': f'{bills_created} rent bills generated'})

@app.route('/api/bills', methods=['POST'])
@token_required
@admin_required
def create_bill(current_user):
    data = request.json
    bill = Bill(
        tenant_id=data['tenant_id'],
        bill_type=data['bill_type'],
        amount=data['amount'],
        billing_month=data.get('billing_month'),
        due_date=datetime.fromisoformat(data['due_date']).date()
    )
    db.session.add(bill)
    db.session.commit()
    return jsonify({'message': 'Bill created', 'id': bill.id}), 201

@app.route('/api/bills/<int:bill_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_bill(current_user, bill_id):
    bill = Bill.query.get_or_404(bill_id)
    db.session.delete(bill)
    db.session.commit()
    return jsonify({'message': 'Bill deleted successfully'})

@app.route('/api/bills/<int:bill_id>/pay', methods=['PUT'])
@token_required
def pay_bill(current_user, bill_id):
    bill = Bill.query.get_or_404(bill_id)
    
    # Check authorization
    if current_user.role != 'admin' and (not current_user.tenant or bill.tenant_id != current_user.tenant.id):
        return jsonify({'message': 'Unauthorized'}), 403
    
    bill.status = 'paid'
    bill.paid_date = datetime.now().date()
    db.session.commit()
    return jsonify({'message': 'Bill marked as paid'})

# Complaint Routes
@app.route('/api/complaints', methods=['GET'])
@token_required
def get_complaints(current_user):
    if current_user.role == 'admin':
        complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    else:
        if current_user.tenant:
            complaints = Complaint.query.filter_by(tenant_id=current_user.tenant.id).order_by(Complaint.created_at.desc()).all()
        else:
            complaints = []
    
    return jsonify([{
        'id': c.id,
        'tenant_name': c.tenant.full_name,
        'subject': c.subject,
        'description': c.description,
        'category': c.category,
        'status': c.status,
        'admin_reply': c.admin_reply,
        'created_at': c.created_at.isoformat(),
        'updated_at': c.updated_at.isoformat()
    } for c in complaints])

@app.route('/api/complaints', methods=['POST'])
@token_required
def create_complaint(current_user):
    if not current_user.tenant:
        return jsonify({'message': 'Only tenants can create complaints'}), 403
    
    data = request.json
    complaint = Complaint(
        tenant_id=current_user.tenant.id,
        subject=data['subject'],
        description=data['description'],
        category=data.get('category', 'other')
    )
    db.session.add(complaint)
    db.session.commit()
    return jsonify({'message': 'Complaint submitted', 'id': complaint.id}), 201

@app.route('/api/complaints/<int:complaint_id>/reply', methods=['PUT'])
@token_required
@admin_required
def reply_complaint(current_user, complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.json
    complaint.admin_reply = data['reply']
    complaint.status = data.get('status', 'in_progress')
    db.session.commit()
    return jsonify({'message': 'Reply added'})

# Emergency Contacts
@app.route('/api/emergency-contacts', methods=['GET'])
@token_required
def get_emergency_contacts(current_user):
    contacts = EmergencyContact.query.all()
    return jsonify([{
        'id': c.id,
        'service_type': c.service_type,
        'contact_name': c.contact_name,
        'phone_number': c.phone_number,
        'alternate_phone': c.alternate_phone,
        'available_24x7': c.available_24x7
    } for c in contacts])

@app.route('/api/emergency-contacts', methods=['POST'])
@token_required
@admin_required
def create_emergency_contact(current_user):
    data = request.json
    contact = EmergencyContact(
        service_type=data['service_type'],
        contact_name=data.get('contact_name'),
        phone_number=data['phone_number'],
        alternate_phone=data.get('alternate_phone'),
        available_24x7=data.get('available_24x7', True)
    )
    db.session.add(contact)
    db.session.commit()
    return jsonify({'message': 'Emergency contact added', 'id': contact.id}), 201

@app.route('/api/emergency-contacts/<int:contact_id>', methods=['PUT'])
@token_required
@admin_required
def update_emergency_contact(current_user, contact_id):
    contact = EmergencyContact.query.get_or_404(contact_id)
    data = request.json
    contact.service_type = data.get('service_type', contact.service_type)
    contact.contact_name = data.get('contact_name', contact.contact_name)
    contact.phone_number = data.get('phone_number', contact.phone_number)
    contact.alternate_phone = data.get('alternate_phone', contact.alternate_phone)
    contact.available_24x7 = data.get('available_24x7', contact.available_24x7)
    db.session.commit()
    return jsonify({'message': 'Contact updated'})

@app.route('/api/emergency-contacts/<int:contact_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_emergency_contact(current_user, contact_id):
    contact = EmergencyContact.query.get_or_404(contact_id)
    db.session.delete(contact)
    db.session.commit()
    return jsonify({'message': 'Contact deleted'})

# Announcements
@app.route('/api/announcements', methods=['GET'])
@token_required
def get_announcements(current_user):
    announcements = Announcement.query.order_by(Announcement.created_at.desc()).limit(20).all()
    return jsonify([{
        'id': a.id,
        'title': a.title,
        'message': a.message,
        'priority': a.priority,
        'created_at': a.created_at.isoformat()
    } for a in announcements])

@app.route('/api/announcements', methods=['POST'])
@token_required
@admin_required
def create_announcement(current_user):
    data = request.json
    announcement = Announcement(
        title=data['title'],
        message=data['message'],
        priority=data.get('priority', 'normal')
    )
    db.session.add(announcement)
    db.session.commit()
    return jsonify({'message': 'Announcement created', 'id': announcement.id}), 201

# Dashboard Stats
@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats(current_user):
    total_buildings = Building.query.count()
    total_rooms = Room.query.count()
    occupied_rooms = Room.query.filter_by(status='occupied').count()
    total_tenants = Tenant.query.count()
    pending_bills = Bill.query.filter_by(status='pending').count()
    open_complaints = Complaint.query.filter_by(status='open').count()
    
    # Monthly revenue
    current_month = datetime.now().strftime('%Y-%m')
    monthly_revenue = db.session.query(db.func.sum(Bill.amount)).filter(
        Bill.billing_month == current_month,
        Bill.bill_type == 'rent'
    ).scalar() or 0
    
    return jsonify({
        'total_buildings': total_buildings,
        'total_rooms': total_rooms,
        'occupied_rooms': occupied_rooms,
        'vacant_rooms': total_rooms - occupied_rooms,
        'total_tenants': total_tenants,
        'pending_bills': pending_bills,
        'open_complaints': open_complaints,
        'monthly_revenue': monthly_revenue
    })

@app.route('/api/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Initialize database
@app.route('/api/init-db', methods=['POST'])
def init_db():
    db.create_all()
    
    # Create default admin if doesn't exist
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@rental.com',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        
        # Add default emergency contacts
        emergency_services = [
            {'service_type': 'Police', 'phone_number': '100'},
            {'service_type': 'Fire', 'phone_number': '101'},
            {'service_type': 'Ambulance', 'phone_number': '102'},
            {'service_type': 'Electrician', 'contact_name': 'Local Electrician', 'phone_number': '9876543210'},
            {'service_type': 'Plumber', 'contact_name': 'Local Plumber', 'phone_number': '9876543211'},
        ]
        
        for service in emergency_services:
            contact = EmergencyContact(**service)
            db.session.add(contact)
        
        db.session.commit()
    
    return jsonify({'message': 'Database initialized'}), 200

# ==================== PAYMENT SETTINGS ROUTES ====================

@app.route('/api/payment-settings', methods=['GET'])
@token_required
def get_payment_settings(current_user):
    settings = PaymentSettings.query.first()
    if not settings:
        return jsonify({'upi_id': None, 'upi_qr_code': None})
    return jsonify({
        'upi_id': settings.upi_id,
        'upi_qr_code': settings.upi_qr_code
    })

@app.route('/api/payment-settings', methods=['POST'])
@token_required
@admin_required
def update_payment_settings(current_user):
    data = request.json
    settings = PaymentSettings.query.first()
    
    if not settings:
        settings = PaymentSettings()
        db.session.add(settings)
    
    settings.upi_id = data.get('upi_id')
    db.session.commit()
    return jsonify({'message': 'Payment settings updated'})

@app.route('/api/payment-settings/qr-code', methods=['POST'])
@token_required
@admin_required
def upload_qr_code(current_user):
    if 'qr_code' not in request.files:
        return jsonify({'message': 'No QR code provided'}), 400
    
    file = request.files['qr_code']
    if file.filename:
        filename = f"upi_qr_{uuid.uuid4()}_{secure_filename(file.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        settings = PaymentSettings.query.first()
        if not settings:
            settings = PaymentSettings()
            db.session.add(settings)
        
        settings.upi_qr_code = filename
        db.session.commit()
        return jsonify({'message': 'QR code uploaded', 'qr_code': filename})
    
    return jsonify({'message': 'Invalid file'}), 400

# ==================== BILL PAYMENT WITH SCREENSHOT ====================

@app.route('/api/bills/<int:bill_id>/upload-screenshot', methods=['POST'])
@token_required
def upload_payment_screenshot(current_user, bill_id):
    bill = Bill.query.get_or_404(bill_id)
    
    # Check authorization
    if current_user.role != 'admin' and (not current_user.tenant or bill.tenant_id != current_user.tenant.id):
        return jsonify({'message': 'Unauthorized'}), 403
    
    if 'screenshot' not in request.files:
        return jsonify({'message': 'No screenshot provided'}), 400
    
    file = request.files['screenshot']
    if file.filename:
        filename = f"payment_{bill.id}_{uuid.uuid4()}_{secure_filename(file.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'payment_screenshots', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        file.save(filepath)
        
        bill.payment_screenshot = f"payment_screenshots/{filename}"
        bill.status = 'pending_approval'
        db.session.commit()
        return jsonify({'message': 'Screenshot uploaded. Waiting for admin approval.', 'screenshot': bill.payment_screenshot, 'status': 'pending_approval'})
    
    return jsonify({'message': 'Invalid file'}), 400

@app.route('/api/bills/<int:bill_id>/mark-paid', methods=['PUT'])
@token_required
def mark_bill_paid_with_screenshot(current_user, bill_id):
    bill = Bill.query.get_or_404(bill_id)
    
    # Check authorization
    if current_user.role != 'admin' and (not current_user.tenant or bill.tenant_id != current_user.tenant.id):
        return jsonify({'message': 'Unauthorized'}), 403
    
    # Check if screenshot is uploaded
    if not bill.payment_screenshot:
        return jsonify({'message': 'Please upload payment screenshot first'}), 400
    
    bill.status = 'paid'
    bill.paid_date = datetime.now().date()
    db.session.commit()
    return jsonify({'message': 'Bill marked as paid'})

# ==================== BILL RECEIPT/PRINT ====================

@app.route('/api/bills/<int:bill_id>/receipt', methods=['GET'])
@token_required
def get_bill_receipt(current_user, bill_id):
    bill = Bill.query.get_or_404(bill_id)
    
    # Check authorization
    if current_user.role != 'admin' and (not current_user.tenant or bill.tenant_id != current_user.tenant.id):
        return jsonify({'message': 'Unauthorized'}), 403
    
    tenant = bill.tenant
    room = tenant.room
    building = room.building if room else None
    
    receipt_data = {
        'bill_id': bill.id,
        'receipt_number': f"REC-{bill.id:06d}",
        'date': datetime.now().strftime('%Y-%m-%d'),
        'tenant_name': tenant.full_name,
        'room_number': room.room_number if room else 'N/A',
        'building_name': building.name if building else 'N/A',
        'bill_type': bill.bill_type,
        'amount': bill.amount,
        'billing_month': bill.billing_month,
        'due_date': bill.due_date.strftime('%Y-%m-%d') if bill.due_date else None,
        'paid_date': bill.paid_date.strftime('%Y-%m-%d') if bill.paid_date else None,
        'status': bill.status
    }
    
    return jsonify(receipt_data)

# ==================== ROOMS BY BUILDING ====================

@app.route('/api/buildings/<int:building_id>/rooms', methods=['GET'])
@token_required
def get_rooms_by_building(current_user, building_id):
    rooms = Room.query.filter_by(building_id=building_id).all()
    return jsonify([{
        'id': r.id,
        'room_number': r.room_number,
        'room_type': r.room_type,
        'floor_number': r.floor_number,
        'area_sqft': r.area_sqft,
        'rent_amount': r.rent_amount,
        'status': r.status,
        'category': r.category,
        'tenant_name': r.tenant.full_name if r.tenant else None
    } for r in rooms])

# ==================== ANNOUNCEMENT EDIT/DELETE ====================

@app.route('/api/announcements/<int:announcement_id>', methods=['PUT'])
@token_required
@admin_required
def update_announcement(current_user, announcement_id):
    announcement = Announcement.query.get_or_404(announcement_id)
    data = request.json
    announcement.title = data.get('title', announcement.title)
    announcement.message = data.get('message', announcement.message)
    announcement.priority = data.get('priority', announcement.priority)
    db.session.commit()
    return jsonify({'message': 'Announcement updated'})

@app.route('/api/announcements/<int:announcement_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_announcement(current_user, announcement_id):
    announcement = Announcement.query.get_or_404(announcement_id)
    db.session.delete(announcement)
    db.session.commit()
    return jsonify({'message': 'Announcement deleted'})

# ==================== COMPLAINT CLOSE ====================

@app.route('/api/complaints/<int:complaint_id>/close', methods=['PUT'])
@token_required
@admin_required
def close_complaint(current_user, complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    complaint.status = 'closed'
    db.session.commit()
    return jsonify({'message': 'Complaint closed'})

# ==================== TENANT DOCUMENT MANAGEMENT BY ADMIN ====================

@app.route('/api/tenants/<int:tenant_id>/admin-upload-documents', methods=['POST'])
@token_required
@admin_required
def admin_upload_tenant_documents(current_user, tenant_id):
    tenant = Tenant.query.get_or_404(tenant_id)
    files = request.files.getlist('documents')
    
    import json
    doc_paths = []
    
    for file in files:
        if file.filename:
            filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'tenant_docs', filename)
            file.save(filepath)
            doc_paths.append(f"tenant_docs/{filename}")
    
    existing_docs = json.loads(tenant.documents) if tenant.documents else []
    existing_docs.extend(doc_paths)
    tenant.documents = json.dumps(existing_docs)
    db.session.commit()
    
    return jsonify({'message': 'Documents uploaded by admin', 'documents': existing_docs})

@app.route('/api/tenants/<int:tenant_id>/admin-upload-photo', methods=['POST'])
@token_required
@admin_required
def admin_upload_tenant_photo(current_user, tenant_id):
    tenant = Tenant.query.get_or_404(tenant_id)
    
    if 'photo' not in request.files:
        return jsonify({'message': 'No photo provided'}), 400
    
    photo = request.files['photo']
    if photo.filename:
        filename = f"{uuid.uuid4()}_{secure_filename(photo.filename)}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'tenant_photos', filename)
        photo.save(filepath)
        tenant.photo_path = f"tenant_photos/{filename}"
        db.session.commit()
        return jsonify({'message': 'Photo uploaded by admin', 'photo_path': tenant.photo_path})
    
    return jsonify({'message': 'Invalid photo'}), 400

# ==================== TENANT VIEW OWN DOCUMENTS ====================

@app.route('/api/tenant/my-documents', methods=['GET'])
@token_required
def get_my_documents(current_user):
    if not current_user.tenant:
        return jsonify({'message': 'Not a tenant'}), 403
    
    tenant = current_user.tenant
    
    import json
    documents = json.loads(tenant.documents) if tenant.documents else []
    
    return jsonify({
        'documents': documents,
        'photo': tenant.photo_path,
        'deposit_amount': tenant.deposit_amount,
        'full_name': tenant.full_name,
        'id_proof_type': tenant.id_proof_type,
        'id_proof_number': tenant.id_proof_number
    })

@app.route('/api/tenant/my-profile', methods=['GET'])
@token_required
def get_my_profile(current_user):
    if not current_user.tenant:
        return jsonify({'message': 'Not a tenant'}), 403
    
    tenant = current_user.tenant
    room = tenant.room
    building = room.building if room else None
    
    import json
    documents = json.loads(tenant.documents) if tenant.documents else []
    
    return jsonify({
        'id': tenant.id,
        'full_name': tenant.full_name,
        'email': tenant.email,
        'phone': tenant.phone,
        'photo_path': tenant.photo_path,
        'room_number': room.room_number if room else None,
        'building_name': building.name if building else None,
        'floor_number': room.floor_number if room else None,
        'room_type': room.room_type if room else None,
        'rent_amount': room.rent_amount if room else None,
        'deposit_amount': tenant.deposit_amount,
        'lease_start_date': tenant.lease_start_date.isoformat() if tenant.lease_start_date else None,
        'lease_end_date': tenant.lease_end_date.isoformat() if tenant.lease_end_date else None,
        'id_proof_type': tenant.id_proof_type,
        'emergency_contact_name': tenant.emergency_contact_name,
        'documents': documents
    })


# ==================== NOTIFICATIONS & PAYMENTS ====================

def send_email(to, subject, body):
    try:
        msg = Message(subject, recipients=[to], body=body)
        mail.send(msg)
    except Exception as e:
        print(f"Error sending email: {e}")

@app.route('/api/payment/create-order', methods=['POST'])
@token_required
def create_payment_order(current_user):
    data = request.json
    amount = data.get('amount')
    currency = 'INR'
    
    # Check if using placeholder keys
    if RAZORPAY_KEY_ID == 'rzp_test_placeholder':
        # Return a mock order for testing
        return jsonify({
            'id': f'order_mock_{uuid.uuid4().hex[:10]}',
            'entity': 'order',
            'amount': int(amount * 100),
            'currency': currency,
            'status': 'created',
            'mock': True
        })
    
    if not razorpay_client:
        return jsonify({'message': 'Payment gateway not configured'}), 500
        
    try:
        order = razorpay_client.order.create(dict(amount=int(amount * 100), currency=currency, payment_capture='1'))
        return jsonify(order)
    except Exception as e:
        return jsonify({'message': str(e)}), 400

@app.route('/api/payment/verify', methods=['POST'])
@token_required
def verify_payment(current_user):
    data = request.json
    bill_id = data.get('bill_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')
    
    bill = Bill.query.get_or_404(bill_id)
    
    try:
        # Verify signature (skip for mock)
        if not razorpay_payment_id.startswith('pay_mock_'):
            razorpay_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        
        # Update bill status
        bill.status = 'paid'
        bill.paid_date = datetime.now().date()
        bill.payment_screenshot = 'razorpay_auto_verified' # Marker for system
        db.session.commit()
        
        # Send Notifications
        send_email(current_user.email, 'Payment Successful - RentEase', f"Your payment of Rs. {bill.amount} for {bill.bill_type} ({bill.billing_month}) was successful.\nTransaction ID: {razorpay_payment_id}")
        
        # Notify Admin
        admin = User.query.filter_by(role='admin').first()
        if admin:
            send_email(admin.email, 'New Payment Received', f"Tenant {current_user.username} paid Rs. {bill.amount} via Razorpay.\nBill ID: {bill.id}")
            
        return jsonify({'message': 'Payment verified successfully'})
    except Exception as e:
        return jsonify({'message': 'Payment verification failed'}), 400

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
