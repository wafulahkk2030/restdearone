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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          is_flagged: boolean
          message: string
          message_type: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          message: string
          message_type?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          message?: string
          message_type?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          chat_type: string
          community_id: string | null
          created_at: string
          created_by: string
          id: string
          memorial_id: string | null
          name: string | null
        }
        Insert: {
          chat_type?: string
          community_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          memorial_id?: string | null
          name?: string | null
        }
        Update: {
          chat_type?: string
          community_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          memorial_id?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          billing_cycle: string
          category: string
          cover_questions: Json | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          member_count: number
          name: string
          price_kes: number
          price_usd: number
          story_count: number
        }
        Insert: {
          billing_cycle?: string
          category?: string
          cover_questions?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          member_count?: number
          name: string
          price_kes?: number
          price_usd?: number
          story_count?: number
        }
        Update: {
          billing_cycle?: string
          category?: string
          cover_questions?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          member_count?: number
          name?: string
          price_kes?: number
          price_usd?: number
          story_count?: number
        }
        Relationships: []
      }
      community_members: {
        Row: {
          ai_engagement_score: number | null
          community_id: string
          id: string
          joined_at: string
          last_active_at: string | null
          onboarding_answers: Json | null
          role: string
          status: string
          stories_posted: number
          user_id: string
        }
        Insert: {
          ai_engagement_score?: number | null
          community_id: string
          id?: string
          joined_at?: string
          last_active_at?: string | null
          onboarding_answers?: Json | null
          role?: string
          status?: string
          stories_posted?: number
          user_id: string
        }
        Update: {
          ai_engagement_score?: number | null
          community_id?: string
          id?: string
          joined_at?: string
          last_active_at?: string | null
          onboarding_answers?: Json | null
          role?: string
          status?: string
          stories_posted?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_payments: {
        Row: {
          amount: number
          billing_cycle: string
          community_id: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          payment_reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle?: string
          community_id: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          community_id?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_payments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_stories: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string
          edit_count: number
          id: string
          story_type: string
          title: string
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string
          edit_count?: number
          id?: string
          story_type?: string
          title: string
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string
          edit_count?: number
          id?: string
          story_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_stories_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          details: Json | null
          flag_reason: string
          id: string
          reviewed: boolean
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          details?: Json | null
          flag_reason: string
          id?: string
          reviewed?: boolean
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          details?: Json | null
          flag_reason?: string
          id?: string
          reviewed?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      contributions: {
        Row: {
          created_at: string
          donor_name: string | null
          fundraiser_id: string
          gross_amount: number
          id: string
          is_anonymous: boolean | null
          net_amount: number
          note_to_family: string | null
          payment_reference: string | null
          payment_status: string
          platform_fee: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          donor_name?: string | null
          fundraiser_id: string
          gross_amount: number
          id?: string
          is_anonymous?: boolean | null
          net_amount: number
          note_to_family?: string | null
          payment_reference?: string | null
          payment_status?: string
          platform_fee: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          donor_name?: string | null
          fundraiser_id?: string
          gross_amount?: number
          id?: string
          is_anonymous?: boolean | null
          net_amount?: number
          note_to_family?: string | null
          payment_reference?: string | null
          payment_status?: string
          platform_fee?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      family_verifications: {
        Row: {
          created_at: string
          evidence_text: string | null
          id: string
          memorial_id: string
          relationship: string
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence_text?: string | null
          id?: string
          memorial_id: string
          relationship: string
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence_text?: string | null
          id?: string
          memorial_id?: string
          relationship?: string
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_verifications_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      flower_tributes: {
        Row: {
          created_at: string
          flower_type: string
          id: string
          memorial_id: string
          payment_reference: string | null
          sender_name: string
          sender_user_id: string
          status: string
          tribute_note: string | null
          tribute_value: number
        }
        Insert: {
          created_at?: string
          flower_type: string
          id?: string
          memorial_id: string
          payment_reference?: string | null
          sender_name: string
          sender_user_id: string
          status?: string
          tribute_note?: string | null
          tribute_value: number
        }
        Update: {
          created_at?: string
          flower_type?: string
          id?: string
          memorial_id?: string
          payment_reference?: string | null
          sender_name?: string
          sender_user_id?: string
          status?: string
          tribute_note?: string | null
          tribute_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "flower_tributes_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["forum_category"]
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["forum_category"]
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["forum_category"]
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_images: {
        Row: {
          created_at: string
          fundraiser_id: string
          id: string
          image_url: string
          sort_order: number | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          fundraiser_id: string
          id?: string
          image_url: string
          sort_order?: number | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          fundraiser_id?: string
          id?: string
          image_url?: string
          sort_order?: number | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_images_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraiser_link_clicks: {
        Row: {
          clicked_at: string
          fundraiser_id: string
          id: string
          referrer: string | null
        }
        Insert: {
          clicked_at?: string
          fundraiser_id: string
          id?: string
          referrer?: string | null
        }
        Update: {
          clicked_at?: string
          fundraiser_id?: string
          id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraiser_link_clicks_fundraiser_id_fkey"
            columns: ["fundraiser_id"]
            isOneToOne: false
            referencedRelation: "fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraisers: {
        Row: {
          admin_notes: string | null
          created_at: string
          created_by: string
          current_amount: number
          deadline: string
          description: string | null
          highlight_tier: string | null
          highlight_until: string | null
          id: string
          memorial_id: string | null
          payout_account: string | null
          payout_details: Json | null
          payout_method: string | null
          personal_statement: string | null
          rejection_reason: string | null
          relationship_to_deceased: string | null
          short_id: string | null
          slug: string | null
          status: string
          target_amount: number
          title: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          created_by: string
          current_amount?: number
          deadline: string
          description?: string | null
          highlight_tier?: string | null
          highlight_until?: string | null
          id?: string
          memorial_id?: string | null
          payout_account?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          personal_statement?: string | null
          rejection_reason?: string | null
          relationship_to_deceased?: string | null
          short_id?: string | null
          slug?: string | null
          status?: string
          target_amount: number
          title: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          created_by?: string
          current_amount?: number
          deadline?: string
          description?: string | null
          highlight_tier?: string | null
          highlight_until?: string | null
          id?: string
          memorial_id?: string | null
          payout_account?: string | null
          payout_details?: Json | null
          payout_method?: string | null
          personal_statement?: string | null
          rejection_reason?: string | null
          relationship_to_deceased?: string | null
          short_id?: string | null
          slug?: string | null
          status?: string
          target_amount?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraisers_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          code: string
          community_id: string | null
          created_at: string
          created_by: string
          id: string
          memorial_id: string | null
          uses: number
        }
        Insert: {
          code: string
          community_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          memorial_id?: string | null
          uses?: number
        }
        Update: {
          code?: string
          community_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          memorial_id?: string | null
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      media_embeds: {
        Row: {
          added_by: string
          created_at: string
          embed_type: string
          embed_url: string
          id: string
          memorial_id: string
          title: string | null
        }
        Insert: {
          added_by: string
          created_at?: string
          embed_type?: string
          embed_url: string
          id?: string
          memorial_id: string
          title?: string | null
        }
        Update: {
          added_by?: string
          created_at?: string
          embed_type?: string
          embed_url?: string
          id?: string
          memorial_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_embeds_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_followers: {
        Row: {
          followed_at: string
          id: string
          memorial_id: string
          user_id: string
        }
        Insert: {
          followed_at?: string
          id?: string
          memorial_id: string
          user_id: string
        }
        Update: {
          followed_at?: string
          id?: string
          memorial_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorial_followers_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_journey_events: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          memorial_id: string
          sort_order: number | null
          title: string
          year: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          memorial_id: string
          sort_order?: number | null
          title: string
          year: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          memorial_id?: string
          sort_order?: number | null
          title?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "memorial_journey_events_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_pages: {
        Row: {
          activation_expiry: string | null
          birth_year: number
          common_phrase: string | null
          created_at: string
          created_by: string
          death_year: number
          full_name: string
          id: string
          life_lesson: string | null
          personality_summary: string | null
          relationship_to_creator: string
          status: Database["public"]["Enums"]["memorial_status"]
          unforgettable_moment: string | null
          what_to_remember: string | null
        }
        Insert: {
          activation_expiry?: string | null
          birth_year: number
          common_phrase?: string | null
          created_at?: string
          created_by: string
          death_year: number
          full_name: string
          id?: string
          life_lesson?: string | null
          personality_summary?: string | null
          relationship_to_creator: string
          status?: Database["public"]["Enums"]["memorial_status"]
          unforgettable_moment?: string | null
          what_to_remember?: string | null
        }
        Update: {
          activation_expiry?: string | null
          birth_year?: number
          common_phrase?: string | null
          created_at?: string
          created_by?: string
          death_year?: number
          full_name?: string
          id?: string
          life_lesson?: string | null
          personality_summary?: string | null
          relationship_to_creator?: string
          status?: Database["public"]["Enums"]["memorial_status"]
          unforgettable_moment?: string | null
          what_to_remember?: string | null
        }
        Relationships: []
      }
      memorial_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          memorial_id: string
          photo_url: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          memorial_id: string
          photo_url: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          memorial_id?: string
          photo_url?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memorial_photos_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      memorial_service_info: {
        Row: {
          additional_notes: string | null
          created_at: string | null
          donation_info: string | null
          id: string
          memorial_id: string
          service_date: string | null
          service_time: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string | null
          donation_info?: string | null
          id?: string
          memorial_id: string
          service_date?: string | null
          service_time?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string | null
          donation_info?: string | null
          id?: string
          memorial_id?: string
          service_date?: string | null
          service_time?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memorial_service_info_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: true
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_keywords: {
        Row: {
          frequency: number
          id: string
          keyword: string
          memorial_id: string
        }
        Insert: {
          frequency?: number
          id?: string
          keyword: string
          memorial_id: string
        }
        Update: {
          frequency?: number
          id?: string
          keyword?: string
          memorial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_keywords_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_prompts: {
        Row: {
          created_at: string
          id: string
          prompt_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_text: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_text?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          memorial_id: string
          payment_reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          memorial_id: string
          payment_reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          memorial_id?: string
          payment_reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_login: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_login?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_login?: string | null
          username?: string
        }
        Relationships: []
      }
      prompt_responses: {
        Row: {
          author_id: string
          created_at: string
          id: string
          memorial_id: string
          prompt_id: string
          response: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          memorial_id: string
          prompt_id: string
          response: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          memorial_id?: string
          prompt_id?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_responses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_responses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_responses_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_responses_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "memory_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
          reported_by: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reason: string
          reported_by: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: []
      }
      stories: {
        Row: {
          author_id: string
          content: string
          created_at: string
          edit_count: number
          id: string
          memorial_id: string
          story_type: Database["public"]["Enums"]["story_type"]
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          edit_count?: number
          id?: string
          memorial_id: string
          story_type?: Database["public"]["Enums"]["story_type"]
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          edit_count?: number
          id?: string
          memorial_id?: string
          story_type?: Database["public"]["Enums"]["story_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_memorial_id_fkey"
            columns: ["memorial_id"]
            isOneToOne: false
            referencedRelation: "memorial_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      story_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          story_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string
          id?: string
          story_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          created_at: string
          id: string
          reason: string
          suspended_by: string
          suspension_end_date: string | null
          suspension_type: Database["public"]["Enums"]["suspension_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          suspended_by: string
          suspension_end_date?: string | null
          suspension_type?: Database["public"]["Enums"]["suspension_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          suspended_by?: string
          suspension_end_date?: string | null
          suspension_type?: Database["public"]["Enums"]["suspension_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          created_at: string
          id: string
          issued_by_admin: string
          user_id: string
          warning_reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_by_admin: string
          user_id: string
          warning_reason: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_by_admin?: string
          user_id?: string
          warning_reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_fundraiser_amount: {
        Args: { amount_input: number; fundraiser_id_input: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "platform_admin"
        | "community_moderator"
        | "memorial_moderator"
        | "support_admin"
      forum_category:
        | "losing_a_parent"
        | "losing_a_friend"
        | "community_heroes"
        | "life_lessons"
        | "remembering_teachers"
        | "celebrating_life"
      memorial_status: "active" | "inactive" | "community"
      reaction_type: "touched_me" | "relate_to_this" | "thank_you_for_sharing"
      report_status: "pending" | "under_review" | "resolved" | "dismissed"
      story_type: "memory" | "lesson" | "letter" | "reflection"
      suspension_type: "temporary" | "permanent"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "platform_admin",
        "community_moderator",
        "memorial_moderator",
        "support_admin",
      ],
      forum_category: [
        "losing_a_parent",
        "losing_a_friend",
        "community_heroes",
        "life_lessons",
        "remembering_teachers",
        "celebrating_life",
      ],
      memorial_status: ["active", "inactive", "community"],
      reaction_type: ["touched_me", "relate_to_this", "thank_you_for_sharing"],
      report_status: ["pending", "under_review", "resolved", "dismissed"],
      story_type: ["memory", "lesson", "letter", "reflection"],
      suspension_type: ["temporary", "permanent"],
    },
  },
} as const
