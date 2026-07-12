# -*- coding: utf-8 -*-
from odoo import models, fields, api


class TransitVehicle(models.Model):
    _name = 'transit.vehicle'
    _description = 'Vehicle Registry'
    _rec_name = 'registration_no'

    registration_no = fields.Char(
        string='Registration No.', 
        required=True, 
        copy=False,
        help="Unique vehicle identification number"
    )
    name = fields.Char(
        string='Name/Model', 
        required=True
    )
    vehicle_type = fields.Selection([
        ('van', 'Van'),
        ('truck', 'Truck'),
        ('mini', 'Mini'),
        ('other', 'Other')
    ], string='Type', default='van', required=True)
    
    capacity = fields.Float(
        string='Capacity (kg)', 
        required=True,
        help="Maximum load capacity in kilograms"
    )
    odometer = fields.Float(
        string='Odometer (km)', 
        default=0.0
    )
    acquisition_cost = fields.Float(
        string='Acquisition Cost', 
        default=0.0
    )

    fuel_type = fields.Selection([
    ('diesel', 'Diesel'),
    ('petrol', 'Petrol'),
    ('electric', 'Electric'),
    ('cng', 'CNG')
], string='Fuel Type')

purchase_date = fields.Date(
    string='Purchase Date'
)
    status = fields.Selection([
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('in_shop', 'In Shop'),
        ('retired', 'Retired')
    ], string='Status', default='available', required=True)

    # SQL Constraint to ensure registration number is unique
    _sql_constraints = [
        ('registration_no_unique', 'unique(registration_no)', 'The vehicle registration number must be unique!')
    ]