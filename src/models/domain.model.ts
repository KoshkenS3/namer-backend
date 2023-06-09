import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, SchemaTypes, Types } from 'mongoose'

import { v4 as uuidv4 } from 'uuid'

export type DomainDocument = Domain & Document

@Schema({ timestamps: true })
export class Domain extends Document {
  @Prop({
    type: String,
    default: () => {
      return uuidv4()
    },
  })
  _id: string

  @Prop({ type: Number })
  nftId: number

  @Prop({ type: String })
  name: string

  @Prop({ type: String })
  fullName: string

  @Prop({ type: String, unique: true })
  address: string

  @Prop({ type: String })
  owner: string

  @Prop({ type: Array<LinkedAddress> })
  linkedAddresses: LinkedAddress[]

  @Prop({ type: Number, required: true })
  price: number

  @Prop({ type: Number, required: true })
  hPrice: number

  @Prop({ type: Number, required: true })
  subPrice: number

  @Prop({ type: String, ref: 'Domain' })
  parentId: string

  @Prop({ type: Number, required: true })
  level: number

  @Prop({ type: [{ type: String, ref: 'Domain' }] })
  subDomains: string[]

  @Prop({ type: SchemaTypes.Mixed })
  additionalData: object
}

export interface LinkedAddress {
  chain: string
  address: string
}

export const DomainSchema = SchemaFactory.createForClass(Domain)
