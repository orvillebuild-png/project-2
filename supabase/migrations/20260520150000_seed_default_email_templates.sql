do $$
declare
  workspace record;
  template record;
  font_css text;
begin
  for workspace in select id from public.orgs loop
    for template in
      select * from (values
        ('Gala Fundraiser', 'Formal fundraising invitation for donor dinners, galas, and benefit nights.', 'You are invited to {{event_title}}', 'An evening for {{event_title}}', 'Dear {{first_name}},\n\nWe would be honored to welcome you to {{event_title}} on {{event_date}} at {{venue}}.\n\nYour presence helps advance the work behind this mission. Please confirm your attendance here: {{rsvp_link}}\n\nWith appreciation,\nThe hosts', '#151515', '#ffca3a', '#f8f5eb', '#fffdf4', 'MODERN_SERIF', 'Reserve your seat'),
        ('Volunteer Orientation', 'Friendly onboarding template for new volunteer briefings and training sessions.', 'Join us for {{event_title}}', 'Welcome to the volunteer team', 'Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nWe will walk through the mission, roles, expectations, and next steps so you can feel prepared before serving.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you for giving your time.', '#1f6b5d', '#ffca3a', '#eef7f0', '#ffffff', 'ORGANIC_SANS', 'Confirm attendance'),
        ('Community Outreach Day', 'Bright community template for outreach, service days, and local action events.', 'Be part of {{event_title}}', 'Show up for the community', 'Hi {{first_name}},\n\n{{event_title}} is happening on {{event_date}} at {{venue}}, and we would love to have you with us.\n\nThis gathering brings people together for practical support, connection, and local impact.\n\nPlease RSVP here: {{rsvp_link}}\n\nSee you there.', '#0f3d3e', '#f4b942', '#edf6f6', '#ffffff', 'MODERN_SANS', 'Join the day'),
        ('Donor Appreciation Dinner', 'Warm appreciation template for stewardship dinners and donor thank-you events.', 'A thank-you invitation: {{event_title}}', 'An evening of gratitude', 'Dear {{first_name}},\n\nWe are hosting {{event_title}} on {{event_date}} at {{venue}} to thank the people who make this work possible.\n\nPlease join us for a relaxed evening of stories, updates, and appreciation.\n\nKindly RSVP here: {{rsvp_link}}\n\nWith gratitude,\nThe team', '#2f2624', '#d7a85d', '#f7efe6', '#fffaf3', 'BOOK_SERIF', 'RSVP with pleasure'),
        ('Board Meeting Notice', 'Clean operational notice for board, committee, and leadership meetings.', 'Meeting notice: {{event_title}}', '{{event_title}}', 'Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nPlease review any materials before the meeting and confirm whether you can attend.\n\nRSVP here: {{rsvp_link}}\n\nThank you.', '#101820', '#9be7b1', '#eef1f3', '#ffffff', 'GEOMETRIC_SANS', 'Confirm attendance'),
        ('Workshop Registration', 'Practical template for seminars, clinics, trainings, and skill workshops.', 'Your workshop invitation: {{event_title}}', 'Save your seat for {{event_title}}', 'Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nThis workshop is designed to be practical, focused, and useful right away.\n\nPlease reserve your spot here: {{rsvp_link}}\n\nWe hope to see you there.', '#243b53', '#ffd166', '#eef4fb', '#ffffff', 'BOOK_SANS', 'Save my seat'),
        ('Webinar Invite', 'Simple online-event template for webinars, livestreams, and virtual briefings.', 'Online event: {{event_title}}', 'Join us online', 'Hi {{first_name}},\n\n{{event_title}} will take place on {{event_date}}.\n\nJoin us for a focused online session with updates, useful context, and time for questions.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you.', '#111827', '#60a5fa', '#eff6ff', '#ffffff', 'MODERN_SANS', 'Register now'),
        ('Faith Gathering', 'Respectful invitation for worship nights, ministry events, and fellowship gatherings.', 'You are welcome at {{event_title}}', 'You are warmly invited', 'Hi {{first_name}},\n\nWe would be grateful to welcome you to {{event_title}} on {{event_date}} at {{venue}}.\n\nJoin us for a time of fellowship, reflection, and community.\n\nPlease RSVP here: {{rsvp_link}}\n\nPeace and blessings.', '#2d2a4a', '#f6d365', '#f5f2ff', '#ffffff', 'BOOK_SERIF', 'Let us know'),
        ('School Reunion', 'Nostalgic but clean template for alumni gatherings and class reunions.', 'Reunion invitation: {{event_title}}', 'Let us gather again', 'Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nCome reconnect, share stories, and celebrate the people and memories that shaped the years behind us.\n\nPlease RSVP here: {{rsvp_link}}\n\nWe hope you can make it.', '#1f2937', '#f59e0b', '#fff7ed', '#ffffff', 'ROUNDED_SANS', 'I will attend'),
        ('Product Launch', 'Polished launch invitation for announcements, demos, and reveal events.', 'Launch invitation: {{event_title}}', 'Be there when it launches', 'Hi {{first_name}},\n\nWe are inviting you to {{event_title}} on {{event_date}} at {{venue}}.\n\nJoin us for the reveal, a short walkthrough, and a closer look at what comes next.\n\nPlease RSVP here: {{rsvp_link}}\n\nSee you at launch.', '#050505', '#00d084', '#eefbf5', '#ffffff', 'HEAVY_SANS', 'Attend launch'),
        ('Charity Auction', 'Elegant auction template for bidding nights, art auctions, and benefit sales.', 'Auction night: {{event_title}}', 'Bid for a cause', 'Dear {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nJoin us for an evening of bidding, connection, and generosity in support of the mission.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you for supporting the cause.', '#1c1917', '#fbbf24', '#faf3e7', '#fffdf7', 'MODERN_SERIF', 'Join the auction'),
        ('Medical Mission', 'Clear service-oriented template for health missions and clinic days.', 'Health mission invitation: {{event_title}}', 'Serving health together', 'Hi {{first_name}},\n\n{{event_title}} is scheduled for {{event_date}} at {{venue}}.\n\nYour participation helps us support patients, families, and community members who need care.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you for serving.', '#075985', '#38bdf8', '#eef9ff', '#ffffff', 'MODERN_SANS', 'Confirm participation'),
        ('Holiday Celebration', 'Warm seasonal template for year-end parties and appreciation gatherings.', 'Celebrate with us: {{event_title}}', 'A warm holiday gathering', 'Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nJoin us for a relaxed celebration, good food, and time together before the season turns.\n\nPlease RSVP here: {{rsvp_link}}\n\nWarmly,\nThe team', '#3f1d2b', '#f8c471', '#fff4e6', '#fffdf8', 'BOOK_SERIF', 'RSVP now'),
        ('Conference Pass', 'Professional template for summits, conferences, and multi-session events.', 'Conference invitation: {{event_title}}', 'Your invitation to {{event_title}}', 'Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nExpect focused sessions, useful conversations, and room to connect with people working toward similar goals.\n\nPlease RSVP here: {{rsvp_link}}\n\nWe look forward to seeing you.', '#12263a', '#7dd3fc', '#f0f7fb', '#ffffff', 'GEOMETRIC_SANS', 'Claim my spot')
      ) as t(name, description, subject, headline, body, header_bg, accent_color, email_bg, canvas_color, font_key, button_label)
    loop
      font_css := case template.font_key
        when 'BOOK_SERIF' then '"Iowan Old Style", "Palatino Linotype", serif'
        when 'MODERN_SERIF' then 'Charter, Cambria, serif'
        when 'ORGANIC_SANS' then 'Seravek, "Gill Sans Nova", Calibri, sans-serif'
        when 'GEOMETRIC_SANS' then 'Avenir, Montserrat, Corbel, sans-serif'
        when 'HEAVY_SANS' then 'Bahnschrift, "Franklin Gothic Medium", sans-serif'
        when 'ROUNDED_SANS' then 'ui-rounded, Quicksand, Comfortaa, Calibri, sans-serif'
        when 'BOOK_SANS' then 'Optima, Candara, "Noto Sans", sans-serif'
        else '"Helvetica Neue", "Arial Nova", Arial, sans-serif'
      end;

      insert into public.email_templates (
        org_id,
        name,
        description,
        subject,
        html_body,
        design_data,
        merge_tags,
        is_library_template
      )
      select
        workspace.id,
        template.name,
        template.description,
        template.subject,
        template.body,
        jsonb_build_object(
          'editor_mode', 'emailbuilder',
          'unlayer_design', null,
          'email_builder_document', '{}'::jsonb,
          'email_builder_body', replace(template.body, '\n', E'\n'),
          'email_builder_canvas_color', template.canvas_color,
          'email_builder_font', template.font_key,
          'headline', template.headline,
          'intro', '',
          'button_label', template.button_label,
          'footer', 'You are receiving this invitation because you are connected to this event.',
          'show_event_details', true,
          'font_family', font_css,
          'email_bg', template.email_bg,
          'header_bg', template.header_bg,
          'accent_color', template.accent_color,
          'headline_color', '#ffffff',
          'button_text_color', '#161616',
          'text_color', '#181713',
          'muted_color', '#716f66',
          'image_url', '',
          'image_alt', '',
          'image_width', 560,
          'attachment_url', '',
          'attachment_name', '',
          'from_name', 'Project 2',
          'from_email', ''
        ),
        '["first_name", "event_title", "event_date", "venue", "rsvp_link"]'::jsonb,
        true
      where not exists (
        select 1
        from public.email_templates existing
        where existing.org_id = workspace.id
          and existing.name = template.name
          and existing.is_library_template = true
      );
    end loop;
  end loop;
end $$;
