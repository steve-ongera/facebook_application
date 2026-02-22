"""
Management command: seed_data
-------------------------------
Usage:
    python manage.py seed_data

What it does:
    - Creates 8 sample users
    - Loads post images from  D:\\BACKUP\\Complete Projects\\Ecommerced_Website\\backend\\New folder
      (falls back to colourful solid-colour placeholder PNGs if that folder is missing)
    - Creates 20 posts (some with images, some text-only)
    - Adds likes and comments between users
    - Sends a few sample messages between users

Place this file at:
    social/management/commands/seed_data.py

Also create the empty __init__.py files if they don't exist:
    social/management/__init__.py
    social/management/commands/__init__.py
"""

import os
import io
import random
import struct
import zlib
from pathlib import Path

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from django.db import transaction

from social.models import Post, Like, Comment, Message

User = get_user_model()

# ─── Windows image folder ────────────────────────────────────────────────────
IMAGE_FOLDER = Path(r"D:\BACKUP\Complete Projects\Ecommerced_Website\backend\New folder")

# ─── Sample data pools ────────────────────────────────────────────────────────
USERS = [
    {"username": "alice",   "first_name": "Alice",   "last_name": "Martin",   "email": "alice@demo.com",   "bio": "Coffee lover ☕ | Traveller 🌍"},
    {"username": "bob",     "first_name": "Bob",     "last_name": "Johnson",  "email": "bob@demo.com",     "bio": "Basketball fan 🏀 | Dev by day"},
    {"username": "carol",   "first_name": "Carol",   "last_name": "Williams", "email": "carol@demo.com",   "bio": "Photographer 📷 | Dog mom 🐶"},
    {"username": "dave",    "first_name": "Dave",    "last_name": "Brown",    "email": "dave@demo.com",    "bio": "Gym rat 💪 | Foodie 🍕"},
    {"username": "eve",     "first_name": "Eve",     "last_name": "Davis",    "email": "eve@demo.com",     "bio": "Bookworm 📚 | Tea enthusiast 🍵"},
    {"username": "frank",   "first_name": "Frank",   "last_name": "Miller",   "email": "frank@demo.com",   "bio": "Gamer 🎮 | Night owl 🦉"},
    {"username": "grace",   "first_name": "Grace",   "last_name": "Wilson",   "email": "grace@demo.com",   "bio": "Yoga instructor 🧘 | Plant parent 🌱"},
    {"username": "henry",   "first_name": "Henry",   "last_name": "Moore",    "email": "henry@demo.com",   "bio": "Music producer 🎧 | Car enthusiast 🚗"},
]

POST_TEXTS = [
    "Just got back from the most amazing road trip! The views were absolutely breathtaking. 🌄",
    "Tried a new recipe today — homemade ramen from scratch. Took 4 hours but so worth it! 🍜",
    "Can't believe how fast this year is going. Grateful for every moment though. 🙏",
    "Working from a coffee shop today. Productivity: 10/10. Vibes: also 10/10. ☕💻",
    "Finally finished reading Dune! What an absolute masterpiece. Any book recommendations?",
    "Morning run ✅ Healthy breakfast ✅ Now just need the motivation to open my laptop 😅",
    "Hot take: pineapple on pizza is actually incredible. Fight me. 🍍🍕",
    "Just adopted a rescue dog! Meet Biscuit 🐾 He's already stolen my heart (and my socks).",
    "Three things I'm grateful for today: good coffee, sunshine, and fast Wi-Fi. Simple joys.",
    "Anyone else feel like weekends go by 3× faster than weekdays? The physics don't add up.",
    "Spent the whole day reorganising my room and honestly it's giving me a new lease on life.",
    "Just discovered a tiny bookshop around the corner from my flat. This is dangerous.",
    "Learning to play guitar — my fingers hurt but I can now almost play Wonderwall 🎸",
    "PSA: drink water, touch grass, and call someone you miss today. That's the whole post.",
    "Some days the imposter syndrome hits harder than others. Remind yourself you belong here.",
    "Just hit 100 commits on my side project! It's far from done but progress is progress 🚀",
    "Street food festival in town today and I have zero regrets about what I spent 🌮🥙",
    "Reminder that it's okay to rest. You don't have to be productive every single day.",
    "Watched the sunrise this morning for the first time in forever. 10/10 would recommend.",
    "My cat just knocked over my coffee, stared at me, and walked away. Iconic behaviour.",
]

COMMENTS = [
    "This is so relatable! 😂",
    "Love this! ❤️",
    "You're absolutely right on this one.",
    "Okay but same though 😅",
    "This made my day, thank you!",
    "Such a vibe ✨",
    "I needed to read this today.",
    "Haha this is literally me every time 😂",
    "Facts! Couldn't agree more.",
    "Wait, we need to talk about this more 👀",
    "This is goals honestly.",
    "Sending good vibes your way 🙌",
    "The accuracy of this post is concerning 😭",
    "Okay I'm stealing this idea, hope you don't mind!",
    "Please tell me there are more photos from this!",
]

MESSAGES = [
    ("alice",  "bob",   "Hey Bob! How have you been? 😊"),
    ("bob",    "alice", "Alice! Long time no see. I've been great, just super busy with work. You?"),
    ("alice",  "bob",   "Same here! We should catch up properly soon. Coffee this weekend?"),
    ("bob",    "alice", "100%! Saturday works for me. Pick a spot and I'm there ☕"),
    ("carol",  "dave",  "Dave did you see the game last night??"),
    ("dave",   "carol", "YES! Unbelievable finish. My heart nearly gave out 😂"),
    ("carol",  "dave",  "Same haha. Anyway, are you coming to Eve's thing on Friday?"),
    ("dave",   "carol", "Wouldn't miss it. Should I bring food?"),
    ("eve",    "frank", "Frank I need your honest opinion on something"),
    ("frank",  "eve",   "Always. Hit me."),
    ("eve",    "frank", "Should I quit my job and go freelance? I've been thinking about it for months."),
    ("frank",  "eve",   "That's a big step. What does your gut say? Because honestly you're talented enough."),
    ("grace",  "henry", "Your last playlist was 🔥 please make another one"),
    ("henry",  "grace", "Haha already on it! Dropped a new one this morning, check it out 🎧"),
    ("grace",  "henry", "How are you always so consistent?? Teach me your ways."),
]


# ─── Tiny PNG generator (solid colour, no Pillow needed) ──────────────────────

def _make_png(width: int, height: int, rgb: tuple) -> bytes:
    """Generate a minimal valid PNG of a solid colour without Pillow."""
    def chunk(name: bytes, data: bytes) -> bytes:
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xFFFFFFFF)

    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)

    raw_row = b'\x00' + bytes(rgb) * width           # filter byte + RGB pixels
    raw = raw_row * height
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return signature + ihdr + idat + iend


PLACEHOLDER_COLOURS = [
    (29,  161, 242),   # twitter blue
    (225, 48,  108),   # instagram pink
    (66,  183, 42),    # green
    (255, 165, 0),     # orange
    (138, 43,  226),   # purple
    (220, 53,  69),    # red
    (23,  162, 184),   # cyan
    (255, 193, 7),     # yellow
]


def get_image_files() -> list[Path]:
    """Return image Paths from the Windows folder, or empty list."""
    if IMAGE_FOLDER.exists():
        exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        imgs = [p for p in IMAGE_FOLDER.iterdir() if p.suffix.lower() in exts]
        if imgs:
            return imgs
    return []


def image_content_for_post(index: int, image_files: list[Path]):
    """
    Return (filename, ContentFile) for a post image.
    Uses real files if available, otherwise a solid-colour placeholder PNG.
    """
    if image_files:
        path = image_files[index % len(image_files)]
        data = path.read_bytes()
        return path.name, ContentFile(data, name=path.name)
    else:
        colour = PLACEHOLDER_COLOURS[index % len(PLACEHOLDER_COLOURS)]
        png    = _make_png(800, 600, colour)
        name   = f"placeholder_{index}.png"
        return name, ContentFile(png, name=name)


# ─── Command ──────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = (
        "Seed the database with sample users, posts (with images from "
        r"D:\BACKUP\Complete Projects\Ecommerced_Website\backend\New folder"
        "), likes, comments and messages."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing seed data before inserting fresh data.',
        )

    @transaction.atomic
    def handle(self, *args, **options):

        # ── Optional wipe ──────────────────────────────────────────────────
        if options['clear']:
            self.stdout.write(self.style.WARNING('⚠  Clearing existing data…'))
            Message.objects.all().delete()
            Comment.objects.all().delete()
            Like.objects.all().delete()
            Post.objects.all().delete()
            User.objects.exclude(is_superuser=True).delete()
            self.stdout.write(self.style.WARNING('   Done.\n'))

        # ── 1. Users ───────────────────────────────────────────────────────
        self.stdout.write('👤 Creating users…')
        created_users = []
        for data in USERS:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name':  data['last_name'],
                    'email':      data['email'],
                    'bio':        data['bio'],
                },
            )
            if created:
                user.set_password('password123')   # universal seed password
                user.save()
                self.stdout.write(f'   ✅ Created  @{user.username}')
            else:
                self.stdout.write(f'   ⏭  Exists   @{user.username}')
            created_users.append(user)

        # ── 2. Friends (mutual) ────────────────────────────────────────────
        self.stdout.write('\n🤝 Adding friendships…')
        pairs = [
            ('alice', 'bob'), ('alice', 'carol'), ('alice', 'eve'),
            ('bob',   'dave'), ('bob', 'frank'),
            ('carol', 'grace'), ('dave', 'henry'), ('eve', 'grace'),
        ]
        user_map = {u.username: u for u in created_users}
        for a_name, b_name in pairs:
            a, b = user_map[a_name], user_map[b_name]
            a.friends.add(b)
            self.stdout.write(f'   🔗 {a_name} ↔ {b_name}')

        # ── 3. Posts ───────────────────────────────────────────────────────
        self.stdout.write('\n📝 Creating posts…')
        image_files = get_image_files()

        if image_files:
            self.stdout.write(
                self.style.SUCCESS(f'   📁 Found {len(image_files)} image(s) in {IMAGE_FOLDER}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'   ⚠  Image folder not found or empty: {IMAGE_FOLDER}\n'
                    '      Using solid-colour placeholder PNGs instead.'
                )
            )

        created_posts = []
        # Evenly distribute posts among users
        for i, text in enumerate(POST_TEXTS):
            author   = created_users[i % len(created_users)]
            with_img = (i % 3 == 0)                 # every 3rd post gets an image

            post = Post(author=author, content=text)

            if with_img:
                fname, content_file = image_content_for_post(i, image_files)
                post.image.save(fname, content_file, save=False)

            post.save()
            created_posts.append(post)
            img_label = f' + image ({image_files[i % len(image_files)].name if image_files else "placeholder"})' if with_img else ''
            self.stdout.write(f'   📄 Post {post.id:>3} by @{author.username}{img_label}')

        # ── 4. Likes ───────────────────────────────────────────────────────
        self.stdout.write('\n❤️  Adding likes…')
        like_count = 0
        for post in created_posts:
            # Each post gets liked by 1–5 random users (excluding the author)
            likers = random.sample(
                [u for u in created_users if u != post.author],
                k=random.randint(1, min(5, len(created_users) - 1)),
            )
            for liker in likers:
                Like.objects.get_or_create(user=liker, post=post)
                like_count += 1
        self.stdout.write(f'   👍 {like_count} likes created.')

        # ── 5. Comments ────────────────────────────────────────────────────
        self.stdout.write('\n💬 Adding comments…')
        comment_count = 0
        for post in created_posts:
            num_comments = random.randint(0, 3)
            commenters = random.sample(
                [u for u in created_users if u != post.author],
                k=min(num_comments, len(created_users) - 1),
            )
            for commenter in commenters:
                Comment.objects.create(
                    author=commenter,
                    post=post,
                    content=random.choice(COMMENTS),
                )
                comment_count += 1
        self.stdout.write(f'   💬 {comment_count} comments created.')

        # ── 6. Messages ────────────────────────────────────────────────────
        self.stdout.write('\n📨 Adding messages…')
        msg_count = 0
        for sender_name, receiver_name, content in MESSAGES:
            if sender_name in user_map and receiver_name in user_map:
                Message.objects.create(
                    sender=user_map[sender_name],
                    receiver=user_map[receiver_name],
                    content=content,
                )
                msg_count += 1
                self.stdout.write(f'   ✉  @{sender_name} → @{receiver_name}')
        self.stdout.write(f'   📨 {msg_count} messages created.')

        # ── Summary ────────────────────────────────────────────────────────
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write(self.style.SUCCESS('✅ Seed complete!'))
        self.stdout.write(self.style.SUCCESS(f'   Users    : {len(created_users)}'))
        self.stdout.write(self.style.SUCCESS(f'   Posts    : {len(created_posts)}'))
        self.stdout.write(self.style.SUCCESS(f'   Likes    : {like_count}'))
        self.stdout.write(self.style.SUCCESS(f'   Comments : {comment_count}'))
        self.stdout.write(self.style.SUCCESS(f'   Messages : {msg_count}'))
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write('')
        self.stdout.write('   Login with any seeded account using password: password123')
        self.stdout.write('   e.g.  username: alice   password: password123')
        self.stdout.write('')