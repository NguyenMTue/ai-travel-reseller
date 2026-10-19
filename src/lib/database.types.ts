export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      affiliate_links: {
        Row: {
          campaign_id: string
          clicks_count: number
          created_at: string
          destination_url: string
          id: string
          is_active: boolean
          product_id: string
          reseller_id: string
          short_url: string | null
          unique_code: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          clicks_count?: number
          created_at?: string
          destination_url: string
          id?: string
          is_active?: boolean
          product_id: string
          reseller_id: string
          short_url?: string | null
          unique_code: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          clicks_count?: number
          created_at?: string
          destination_url?: string
          id?: string
          is_active?: boolean
          product_id?: string
          reseller_id?: string
          short_url?: string | null
          unique_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          commission_rate: number | null
          description: string | null
          end_date: string | null
          id: string
          merchant_id: string | null
          name: string
          product_id: string | null
          start_date: string | null
          status: string | null
          target_audience: string | null
          target_location: string | null
        }
        Insert: {
          commission_rate?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          merchant_id?: string | null
          name: string
          product_id?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          target_location?: string | null
        }
        Update: {
          commission_rate?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          merchant_id?: string | null
          name?: string
          product_id?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          target_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      clicks: {
        Row: {
          bot_name: string | null
          browser: string | null
          clicked_at: string
          device_type: string | null
          id: string
          invalid_reason: string | null
          ip_address: string | null
          is_bot: boolean
          is_valid: boolean
          link_id: string
          metadata: Json
          os: string | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          bot_name?: string | null
          browser?: string | null
          clicked_at?: string
          device_type?: string | null
          id?: string
          invalid_reason?: string | null
          ip_address?: string | null
          is_bot?: boolean
          is_valid?: boolean
          link_id: string
          metadata?: Json
          os?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          bot_name?: string | null
          browser?: string | null
          clicked_at?: string
          device_type?: string | null
          id?: string
          invalid_reason?: string | null
          ip_address?: string | null
          is_bot?: boolean
          is_valid?: boolean
          link_id?: string
          metadata?: Json
          os?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          campaign_id: string | null
          caption: string | null
          created_at: string | null
          cta: string | null
          generation_key: string | null
          hook: string | null
          id: string
          persona: string | null
          product_id: string | null
          reseller_id: string | null
          script: string | null
          status: string | null
          tracking_url: string | null
          video_url: string | null
        }
        Insert: {
          campaign_id?: string | null
          caption?: string | null
          created_at?: string | null
          cta?: string | null
          generation_key?: string | null
          hook?: string | null
          id?: string
          persona?: string | null
          product_id?: string | null
          reseller_id?: string | null
          script?: string | null
          status?: string | null
          tracking_url?: string | null
          video_url?: string | null
        }
        Update: {
          campaign_id?: string | null
          caption?: string | null
          created_at?: string | null
          cta?: string | null
          generation_key?: string | null
          hook?: string | null
          id?: string
          persona?: string | null
          product_id?: string | null
          reseller_id?: string | null
          script?: string | null
          status?: string | null
          tracking_url?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          logo: string | null
          name: string
          phone: string | null
          status: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name: string
          phone?: string | null
          status?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          booking_reference: string | null
          commission_amount: number | null
          created_at: string | null
          id: string
          merchant_id: string | null
          product_id: string | null
          reseller_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          booking_reference?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          product_id?: string | null
          reseller_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          booking_reference?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          product_id?: string | null
          reseller_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_embeddings: {
        Row: {
          chunk_index: number
          content: string
          content_hash: string | null
          created_at: string
          embedding: string
          id: string
          metadata: Json
          model: string
          product_id: string
          updated_at: string
        }
        Insert: {
          chunk_index?: number
          content: string
          content_hash?: string | null
          created_at?: string
          embedding: string
          id?: string
          metadata?: Json
          model?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          content_hash?: string | null
          created_at?: string
          embedding?: string
          id?: string
          metadata?: Json
          model?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          booking_url: string | null
          category: string | null
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: string
          merchant_id: string | null
          name: string
          original_price: number | null
          payment_url: string | null
          sale_price: number | null
          status: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          booking_url?: string | null
          category?: string | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          merchant_id?: string | null
          name: string
          original_price?: number | null
          payment_url?: string | null
          sale_price?: number | null
          status?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          booking_url?: string | null
          category?: string | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          merchant_id?: string | null
          name?: string
          original_price?: number | null
          payment_url?: string | null
          sale_price?: number | null
          status?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          average_views: number | null
          created_at: string | null
          followers: number | null
          id: string
          platform: string | null
          reseller_id: string | null
          status: string | null
          url: string | null
          username: string | null
        }
        Insert: {
          average_views?: number | null
          created_at?: string | null
          followers?: number | null
          id?: string
          platform?: string | null
          reseller_id?: string | null
          status?: string | null
          url?: string | null
          username?: string | null
        }
        Update: {
          average_views?: number | null
          created_at?: string | null
          followers?: number | null
          id?: string
          platform?: string | null
          reseller_id?: string | null
          status?: string | null
          url?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          campaign_id: string | null
          event_type: string | null
          id: string
          metadata: Json | null
          product_id: string | null
          reseller_id: string | null
          timestamp: string | null
        }
        Insert: {
          campaign_id?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          reseller_id?: string | null
          timestamp?: string | null
        }
        Update: {
          campaign_id?: string | null
          event_type?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          reseller_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_events_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "affiliate_links": {
                  Row: {
                    "campaign_id": string,"clicks_count": number,"created_at": string,"destination_url": string,"id": string,"is_active": boolean,"product_id": string,"reseller_id": string,"short_url": string | null,"unique_code": string,"updated_at": string
                  }
                  Insert: {
                    "campaign_id": string,"clicks_count"?: number,"created_at"?: string,"destination_url": string,"id"?: string,"is_active"?: boolean,"product_id": string,"reseller_id": string,"short_url"?: string | null,"unique_code": string,"updated_at"?: string
                  }
                  Update: {
                    "campaign_id"?: string,"clicks_count"?: number,"created_at"?: string,"destination_url"?: string,"id"?: string,"is_active"?: boolean,"product_id"?: string,"reseller_id"?: string,"short_url"?: string | null,"unique_code"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "affiliate_links_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "affiliate_links_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "affiliate_links_reseller_id_fkey"
      columns: ["reseller_id"]
isOneToOne: false
      referencedRelation: "resellers"
      referencedColumns: ["id"]
    }
                  ]
                },"campaigns": {
                  Row: {
                    "commission_rate": number | null,"end_date": string | null,"id": string,"merchant_id": string | null,"name": string,"product_id": string | null,"start_date": string | null,"status": string | null,"target_audience": string | null,"target_location": string | null
                  }
                  Insert: {
                    "commission_rate"?: number | null,"end_date"?: string | null,"id"?: string,"merchant_id"?: string | null,"name": string,"product_id"?: string | null,"start_date"?: string | null,"status"?: string | null,"target_audience"?: string | null,"target_location"?: string | null
                  }
                  Update: {
                    "commission_rate"?: number | null,"end_date"?: string | null,"id"?: string,"merchant_id"?: string | null,"name"?: string,"product_id"?: string | null,"start_date"?: string | null,"status"?: string | null,"target_audience"?: string | null,"target_location"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaigns_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campaigns_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"clicks": {
                  Row: {
                    "bot_name": string | null,"browser": string | null,"clicked_at": string,"device_type": string | null,"id": string,"invalid_reason": string | null,"ip_address": string | null,"is_bot": boolean,"is_valid": boolean,"link_id": string,"metadata": NonNullable<Json>,"os": string | null,"referer": string | null,"user_agent": string | null
                  }
                  Insert: {
                    "bot_name"?: string | null,"browser"?: string | null,"clicked_at"?: string,"device_type"?: string | null,"id"?: string,"invalid_reason"?: string | null,"ip_address"?: string | null,"is_bot"?: boolean,"is_valid"?: boolean,"link_id": string,"metadata"?: NonNullable<Json>,"os"?: string | null,"referer"?: string | null,"user_agent"?: string | null
                  }
                  Update: {
                    "bot_name"?: string | null,"browser"?: string | null,"clicked_at"?: string,"device_type"?: string | null,"id"?: string,"invalid_reason"?: string | null,"ip_address"?: string | null,"is_bot"?: boolean,"is_valid"?: boolean,"link_id"?: string,"metadata"?: NonNullable<Json>,"os"?: string | null,"referer"?: string | null,"user_agent"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clicks_link_id_fkey"
      columns: ["link_id"]
isOneToOne: false
      referencedRelation: "affiliate_links"
      referencedColumns: ["id"]
    }
                  ]
                },"commissions": {
                  Row: {
                    "campaign_id": string | null,"created_at": string,"gross_amount": number,"id": string,"merchant_id": string,"net_amount": number,"order_id": string,"payout_id": string | null,"platform_fee": number,"reseller_id": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "campaign_id"?: string | null,"created_at"?: string,"gross_amount"?: number,"id"?: string,"merchant_id": string,"net_amount"?: number,"order_id": string,"payout_id"?: string | null,"platform_fee"?: number,"reseller_id": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "campaign_id"?: string | null,"created_at"?: string,"gross_amount"?: number,"id"?: string,"merchant_id"?: string,"net_amount"?: number,"order_id"?: string,"payout_id"?: string | null,"platform_fee"?: number,"reseller_id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "commissions_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commissions_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commissions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "commissions_reseller_id_fkey"
      columns: ["reseller_id"]
isOneToOne: false
      referencedRelation: "resellers"
      referencedColumns: ["id"]
    }
                  ]
                },"contents": {
                  Row: {
                    "campaign_id": string | null,"caption": string | null,"created_at": string | null,"cta": string | null,"hook": string | null,"id": string,"persona": string | null,"product_id": string | null,"reseller_id": string | null,"script": string | null,"status": string | null,"tracking_url": string | null,"video_url": string | null
                  }
                  Insert: {
                    "campaign_id"?: string | null,"caption"?: string | null,"created_at"?: string | null,"cta"?: string | null,"hook"?: string | null,"id"?: string,"persona"?: string | null,"product_id"?: string | null,"reseller_id"?: string | null,"script"?: string | null,"status"?: string | null,"tracking_url"?: string | null,"video_url"?: string | null
                  }
                  Update: {
                    "campaign_id"?: string | null,"caption"?: string | null,"created_at"?: string | null,"cta"?: string | null,"hook"?: string | null,"id"?: string,"persona"?: string | null,"product_id"?: string | null,"reseller_id"?: string | null,"script"?: string | null,"status"?: string | null,"tracking_url"?: string | null,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contents_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contents_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contents_reseller_id_fkey"
      columns: ["reseller_id"]
isOneToOne: false
      referencedRelation: "resellers"
      referencedColumns: ["id"]
    }
                  ]
                },"media_references": {
                  Row: {
                    "analysis_metadata": Json,"created_at": string,"duration": number | null,"id": string,"merchant_id": string,"platform": string,"style_tags": string[],"thumbnail_url": string | null,"title": string,"updated_at": string,"video_url": string
                  }
                  Insert: {
                    "analysis_metadata"?: Json,"created_at"?: string,"duration"?: number | null,"id"?: string,"merchant_id": string,"platform"?: string,"style_tags"?: string[],"thumbnail_url"?: string | null,"title": string,"updated_at"?: string,"video_url": string
                  }
                  Update: {
                    "analysis_metadata"?: Json,"created_at"?: string,"duration"?: number | null,"id"?: string,"merchant_id"?: string,"platform"?: string,"style_tags"?: string[],"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string,"video_url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_references_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    }
                  ]
                },"merchants": {
                  Row: {
                    "address": string | null,"created_at": string | null,"description": string | null,"id": string,"logo": string | null,"name": string,"phone": string | null,"status": string | null,"website": string | null
                  }
                  Insert: {
                    "address"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"logo"?: string | null,"name": string,"phone"?: string | null,"status"?: string | null,"website"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"logo"?: string | null,"name"?: string,"phone"?: string | null,"status"?: string | null,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"orders": {
                  Row: {
                    "amount": number | null,"booking_reference": string | null,"campaign_id": string | null,"click_id": string | null,"commission_amount": number | null,"commission_rate": number | null,"created_at": string | null,"currency": string,"customer_name": string | null,"customer_phone": string | null,"flag_self_purchase": boolean,"gross_commission": number,"id": string,"merchant_id": string | null,"notes": string | null,"paid_at": string | null,"platform_fee": number,"product_id": string | null,"reseller_commission": number,"reseller_id": string | null,"status": string | null,"updated_at": string
                  }
                  Insert: {
                    "amount"?: number | null,"booking_reference"?: string | null,"campaign_id"?: string | null,"click_id"?: string | null,"commission_amount"?: number | null,"commission_rate"?: number | null,"created_at"?: string | null,"currency"?: string,"customer_name"?: string | null,"customer_phone"?: string | null,"flag_self_purchase"?: boolean,"gross_commission"?: number,"id"?: string,"merchant_id"?: string | null,"notes"?: string | null,"paid_at"?: string | null,"platform_fee"?: number,"product_id"?: string | null,"reseller_commission"?: number,"reseller_id"?: string | null,"status"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number | null,"booking_reference"?: string | null,"campaign_id"?: string | null,"click_id"?: string | null,"commission_amount"?: number | null,"commission_rate"?: number | null,"created_at"?: string | null,"currency"?: string,"customer_name"?: string | null,"customer_phone"?: string | null,"flag_self_purchase"?: boolean,"gross_commission"?: number,"id"?: string,"merchant_id"?: string | null,"notes"?: string | null,"paid_at"?: string | null,"platform_fee"?: number,"product_id"?: string | null,"reseller_commission"?: number,"reseller_id"?: string | null,"status"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_click_id_fkey"
      columns: ["click_id"]
isOneToOne: false
      referencedRelation: "clicks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_merchant_id_fkey"
      columns: ["merchant_id"]
isOneToOne: false
      referencedRelation: "merchants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_reseller_id_fkey"
      columns: ["reseller_id"]
isOneToOne: false
      referencedRelation: "resellers"
      referencedColumns: ["id"]
    }
    Views: {
      merchant_public_profiles: {
        Row: {
          id: string | null
          name: string | null
        }
        Insert: {
          id?: string | null
          name?: string | null
        }
        Update: {
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_reseller_click_timeseries: {
        Args: { p_days?: number; p_reseller_id: string }
        Returns: {
          bot_clicks: number
          date: string
          total_clicks: number
          valid_clicks: number
        }[]
      }
      get_reseller_device_stats: {
        Args: { p_reseller_id: string }
        Returns: Json
      }
      get_reseller_overview_stats: {
        Args: { p_reseller_id: string }
        Returns: Json
      }
      get_reseller_top_campaigns: {
        Args: { p_limit?: number; p_reseller_id: string }
        Returns: {
          campaign_id: string
          campaign_name: string
          commission_rate: number
          product_name: string
          short_url: string
          total_clicks: number
          unique_code: string
          valid_clicks: number
        }[]
      }
      match_product_embeddings: {
        Args: {
          filter_product_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          id: string
          metadata: Json
          product_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "get_reseller_click_timeseries":
{ Args: { "p_days"?: number,"p_reseller_id": string }; Returns: {
              "bot_clicks": number,"date": string,"total_clicks": number,"valid_clicks": number
            }[]
                           },
"get_reseller_device_stats":
{ Args: { "p_reseller_id": string }; Returns: Json
                           },
"get_reseller_overview_stats":
{ Args: { "p_reseller_id": string }; Returns: Json
                           },
"get_reseller_top_campaigns":
{ Args: { "p_limit"?: number,"p_reseller_id": string }; Returns: {
              "campaign_id": string,"campaign_name": string,"commission_rate": number,"product_name": string,"short_url": string,"total_clicks": number,"unique_code": string,"valid_clicks": number
            }[]
                           },
"match_product_embeddings":
{ Args: { "filter_product_id"?: string,"match_count"?: number,"match_threshold"?: number,"query_embedding": string }; Returns: {
              "chunk_index": number,"content": string,"id": string,"metadata": Json,"product_id": string,"similarity": number
            }[]
                           },
"get_reseller_wallet_summary":
{ Args: { "p_reseller_id": string }; Returns: Json
                            },
"process_order_attribution":
{ Args: {
              "p_booking_reference": string,
              "p_campaign_id"?: string | null,
              "p_click_id"?: string | null,
              "p_customer_name"?: string | null,
              "p_customer_phone"?: string | null,
              "p_merchant_id": string,
              "p_notes"?: string | null,
              "p_order_amount": number,
              "p_product_id": string,
              "p_reseller_id"?: string | null,
              "p_status"?: string | null
            }; Returns: Json
                            }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
