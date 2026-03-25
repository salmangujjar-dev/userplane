.PHONY: help install dev dev\:web dev\:home dev\:api dev\:share dev\:email dev\:ramp dev\:docs build build\:web build\:home build\:api build\:share build\:ramp build\:zendesk lint lint\:fix format format\:check fmt fmt\:check fmt\:fix typecheck test test\:watch test\:api check fix clean clean\:all clean\:deep reset preview\:home deploy\:home deploy\:home\:production update env\:setup env\:check db\:generate db\:generate\:production db\:migrate db\:migrate\:production db\:push db\:push\:production db\:reset db\:studio db\:studio\:production ramp\:db\:generate ramp\:db\:migrate ramp\:db\:push ramp\:db\:reset ramp\:db\:seed ramp\:db\:studio pricing\:sync pricing\:sync\:production inngest\:dev storybook\:recorder storybook\:recorder\:build storybook\:postbridge storybook\:postbridge\:build storybook\:blurr storybook\:blurr\:build storybook\:sdk storybook\:sdk\:build storybook\:embed storybook\:embed\:build storybook\:logger storybook\:logger\:build storybook\:zendesk storybook\:zendesk\:build serve\:zendesk package\:zendesk assets\:upload assets\:upload\:production assets\:upload\:dry-run assets\:manifest assets\:validate assets\:validate\:local assets\:validate\:production tunnel\:start tunnel\:stop tunnel\:status sdk\:build sdk\:build\:npm sdk\:build\:cdn sdk\:build\:npm\:obfuscate sdk\:build\:cdn\:obfuscate metadata\:build metadata\:build\:npm metadata\:build\:cdn embed\:build embed\:build\:cdn embed\:build\:cdn\:dev embed\:build\:cdn\:production embed\:upload embed\:upload\:production embed\:upload\:dry-run embed\:deploy embed\:deploy\:production dev\:extension build\:extension zip\:extension storybook\:extension storybook\:extension\:build i d b l f t c
.DEFAULT_GOAL := help

# Colors
CYAN := \033[0;36m
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
MAGENTA := \033[0;35m
WHITE := \033[1;37m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)"
	@echo "╔══════════════════════════════════════════════════════════════════════╗"
	@echo "║                                                                      ║"
	@echo "║         ▗▖ ▗▖ ▗▄▄▖▗▄▄▄▖▗▄▄▖ ▗▄▄▖ ▗▖    ▗▄▖ ▗▖  ▗▖▗▄▄▄▖               ║"
	@echo "║         ▐▌ ▐▌▐▌   ▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌                  ║"
	@echo "║         ▐▌ ▐▌ ▝▀▚▖▐▛▀▀▘▐▛▀▚▖▐▛▀▘ ▐▌   ▐▛▀▜▌▐▌ ▝▜▌▐▛▀▀▘               ║"
	@echo "║         ▝▚▄▞▘▗▄▄▞▘▐▙▄▄▖▐▌ ▐▌▐▌   ▐▙▄▄▖▐▌ ▐▌▐▌  ▐▌▐▙▄▄▖               ║"
	@echo "║                                                                      ║"
	@echo "║                                                                      ║"
	@echo "╚══════════════════════════════════════════════════════════════════════╝"
	@echo "$(RESET)"
	@echo ""
	@echo "$(WHITE)╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(WHITE)║                                   Available Commands                                              ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ Command                       ║ Description                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)SETUP$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)install$(WHITE)                       ║$(RESET) Install all dependencies                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)update$(WHITE)                        ║$(RESET) Update dependencies                                               $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)env:setup$(WHITE)                     ║$(RESET) Copy .env.example files to create .env.development files         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)env:check$(WHITE)                     ║$(RESET) Check if .env.development files exist                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DATABASE$(WHITE)                                                                                          ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate$(WHITE)                   ║$(RESET) Generate migrations (dev)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate:production$(WHITE)        ║$(RESET) Generate migrations (production)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate$(WHITE)                    ║$(RESET) Run migrations (dev)                                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate:production$(WHITE)         ║$(RESET) Run migrations (production)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push$(WHITE)                       ║$(RESET) Push schema directly (dev)                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push:production$(WHITE)            ║$(RESET) Disabled - use db:migrate:production instead                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:reset$(WHITE)                      ║$(RESET) Drop all tables and re-run migrations (dev)                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio$(WHITE)                     ║$(RESET) Open Drizzle Studio (dev)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio:production$(WHITE)          ║$(RESET) Open Drizzle Studio (production)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)PRICING$(WHITE)                                                                                           ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)pricing:sync$(WHITE)                  ║$(RESET) Sync plan metadata to DodoPayments (dev)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)pricing:sync:production$(WHITE)       ║$(RESET) Sync plan metadata to DodoPayments (production)                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DEVELOPMENT$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev$(WHITE)                           ║$(RESET) Run all apps in development mode                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:web$(WHITE)                       ║$(RESET) Run web app only                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:api$(WHITE)                       ║$(RESET) Run API only                                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:share$(WHITE)                     ║$(RESET) Run Share URL shortener only                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:email$(WHITE)                     ║$(RESET) Run Email preview server only                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:ramp$(WHITE)                      ║$(RESET) Run ramp app only                                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:home$(WHITE)                      ║$(RESET) Run home app only                                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:docs$(WHITE)                      ║$(RESET) Run docs app only (Mintlify)                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:extension$(WHITE)                 ║$(RESET) Run Chrome extension in dev mode (WXT, port 3010)                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BUILD$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build$(WHITE)                         ║$(RESET) Build all apps                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:web$(WHITE)                     ║$(RESET) Build web app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:api$(WHITE)                     ║$(RESET) Build API only                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:share$(WHITE)                   ║$(RESET) Build Share URL shortener only                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:home$(WHITE)                    ║$(RESET) Build home app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:ramp$(WHITE)                    ║$(RESET) Build Ramp app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)package:zendesk$(WHITE)               ║$(RESET) Package Zendesk manifest .zip (dev)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)preview:home$(WHITE)                  ║$(RESET) Preview home production build (Cloudflare)                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)deploy:home$(WHITE)                   ║$(RESET) Deploy home app (preview)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:extension$(WHITE)               ║$(RESET) Build Chrome extension                                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)zip:extension$(WHITE)                 ║$(RESET) Zip Chrome extension for distribution                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)deploy:home:production$(WHITE)        ║$(RESET) Deploy home app (production)                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)CODE QUALITY$(WHITE)                                                                                      ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint$(WHITE)                          ║$(RESET) Run linter                                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint:fix$(WHITE)                      ║$(RESET) Run linter and fix issues                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format$(WHITE)                        ║$(RESET) Format all files                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format:check$(WHITE)                  ║$(RESET) Check formatting                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)typecheck$(WHITE)                     ║$(RESET) Type check all packages                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)fix$(WHITE)                           ║$(RESET) Fix all issues (lint + format)                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)check$(WHITE)                         ║$(RESET) Run all checks (lint + type + format)                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)TESTING$(WHITE)                                                                                           ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test$(WHITE)                          ║$(RESET) Run all tests                                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test:watch$(WHITE)                    ║$(RESET) Run tests in watch mode                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test:api$(WHITE)                      ║$(RESET) Test API endpoints                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)STORYBOOK$(WHITE)                                                                                         ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:recorder$(WHITE)            ║$(RESET) Run Storybook for recorder app                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:recorder:build$(WHITE)      ║$(RESET) Build Storybook for recorder app                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:postbridge$(WHITE)          ║$(RESET) Run Storybook for postbridge package                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:postbridge:build$(WHITE)    ║$(RESET) Build Storybook for postbridge package                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:blurr$(WHITE)               ║$(RESET) Run Storybook for blurr package                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:blurr:build$(WHITE)         ║$(RESET) Build Storybook for blurr package                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:sdk$(WHITE)                 ║$(RESET) Run Storybook for SDK package                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:sdk:build$(WHITE)           ║$(RESET) Build Storybook for SDK package                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:embed$(WHITE)               ║$(RESET) Run Storybook for embed package                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:embed:build$(WHITE)         ║$(RESET) Build Storybook for embed package                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:dash$(WHITE)                ║$(RESET) Run Storybook for dashboard (incl. Zendesk)                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:dash:build$(WHITE)          ║$(RESET) Build Storybook for dashboard                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:extension$(WHITE)           ║$(RESET) Run Storybook for Chrome extension (port 6012)                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:extension:build$(WHITE)     ║$(RESET) Build Storybook for Chrome extension                               $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)ZENDESK$(WHITE)                                                                                            ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)package:zendesk$(WHITE)               ║$(RESET) Package Zendesk manifest .zip (dev)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)package:zendesk:prod$(WHITE)          ║$(RESET) Package Zendesk manifest .zip (prod)                               $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)RAMP$(WHITE)                                                                                              ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)ramp:db:generate$(WHITE)              ║$(RESET) Generate Ramp Drizzle migrations                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)ramp:db:migrate$(WHITE)               ║$(RESET) Run Ramp database migrations                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)ramp:db:push$(WHITE)                  ║$(RESET) Push Ramp schema directly to DB                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)ramp:db:reset$(WHITE)                 ║$(RESET) Reset Ramp database (drop + migrate + seed)                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)ramp:db:seed$(WHITE)                  ║$(RESET) Seed Ramp database                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)ramp:db:studio$(WHITE)                ║$(RESET) Open Drizzle Studio for Ramp                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)ASSETS (CDN)$(WHITE)                                                                                     ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:upload$(WHITE)                 ║$(RESET) Upload assets to R2 CDN (dev)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:upload:production$(WHITE)      ║$(RESET) Upload assets to R2 CDN (production)                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:upload:dry-run$(WHITE)         ║$(RESET) Preview what would be uploaded (dev)                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:manifest$(WHITE)               ║$(RESET) Generate asset manifest only (no upload)                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:validate$(WHITE)               ║$(RESET) Validate manifest assets exist (local + remote dev)               $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:validate:local$(WHITE)         ║$(RESET) Validate local asset files exist                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:validate:production$(WHITE)    ║$(RESET) Validate assets exist on production CDN                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)TUNNELS (Cloudflare Tunnel)$(WHITE)                                                                      ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)tunnel:start$(WHITE)                  ║$(RESET) Start Cloudflare tunnel (all services)                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)tunnel:stop$(WHITE)                   ║$(RESET) Stop Cloudflare tunnel                                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)tunnel:status$(WHITE)                 ║$(RESET) Show tunnel status and URLs                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BACKGROUND JOBS (Inngest)$(WHITE)                                                                        ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)inngest:dev$(WHITE)                   ║$(RESET) Run Inngest dev server (localhost:8288)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)SDK PACKAGE$(WHITE)                                                                                        ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build$(WHITE)                     ║$(RESET) Build SDK (standard dev build)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:npm$(WHITE)                 ║$(RESET) Build SDK (size-optimized for npm)                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:cdn$(WHITE)                 ║$(RESET) Build SDK (size-optimized for CDN)                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:npm:obfuscate$(WHITE)       ║$(RESET) Build SDK (obfuscated for npm)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:cdn:obfuscate$(WHITE)       ║$(RESET) Build SDK (obfuscated for CDN)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)METADATA PACKAGE$(WHITE)                                                                                   ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)metadata:build$(WHITE)                ║$(RESET) Build Metadata (standard dev build)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)metadata:build:npm$(WHITE)            ║$(RESET) Build Metadata (size-optimized for npm)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)metadata:build:cdn$(WHITE)            ║$(RESET) Build Metadata (size-optimized for CDN)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)EMBED PACKAGE (CDN)$(WHITE)                                                                                ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build$(WHITE)                   ║$(RESET) Build Embed (standard dev build)                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build:cdn$(WHITE)               ║$(RESET) Build Embed for CDN (dev env, alias for embed:build:cdn:dev)       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build:cdn:dev$(WHITE)           ║$(RESET) Build Embed for CDN with dev CDN configuration                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build:cdn:production$(WHITE)    ║$(RESET) Build Embed for CDN with production CDN configuration              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:upload$(WHITE)                  ║$(RESET) Upload Embed to R2 CDN (dev)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:upload:production$(WHITE)       ║$(RESET) Upload Embed to R2 CDN (production)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:upload:dry-run$(WHITE)          ║$(RESET) Preview Embed upload (no changes)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:deploy$(WHITE)                  ║$(RESET) Build and deploy Embed (dev)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:deploy:production$(WHITE)       ║$(RESET) Build and deploy Embed (production)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)MAINTENANCE$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean$(WHITE)                         ║$(RESET) Remove build outputs and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean:all$(WHITE)                     ║$(RESET) Remove deps, builds, and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean:deep$(WHITE)                    ║$(RESET) Remove all node_modules and reinstall                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)reset$(WHITE)                         ║$(RESET) Clean and reinstall everything                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╚═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(YELLOW)Quick Shortcuts:$(RESET) $(CYAN)i$(RESET)=install $(CYAN)d$(RESET)=dev $(CYAN)b$(RESET)=build $(CYAN)l$(RESET)=lint $(CYAN)f$(RESET)=format $(CYAN)t$(RESET)=test $(CYAN)c$(RESET)=check"
	@echo ""

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@bun install
	@echo "$(GREEN)Dependencies installed!$(RESET)"

dev: ## Run all apps in development mode
	@echo "$(MAGENTA)Starting all apps in development mode...$(RESET)"
	@bun dev

dev\:web: ## Run web app only
	@echo "$(MAGENTA)Starting web app (Next.js)...$(RESET)"
	@cd apps/web && bun dev

dev\:api: ## Run API only
	@echo "$(MAGENTA)Starting Hono API...$(RESET)"
	@cd apps/api && bun dev

dev\:share: ## Run Share URL shortener only
	@echo "$(MAGENTA)Starting Share URL shortener...$(RESET)"
	@cd apps/share && bun dev

dev\:email: ## Run Email preview server only
	@echo "$(MAGENTA)Starting Email preview server...$(RESET)"
	@cd packages/email && bun dev

dev\:ramp: ## Run ramp app only
	@echo "$(MAGENTA)Starting Ramp app...$(RESET)"
	@cd apps/ramp && bun dev

dev\:home: ## Run home app only
	@echo "$(MAGENTA)Starting Home app (Astro)...$(RESET)"
	@cd apps/home && bun dev

dev\:docs: ## Run docs app only (Mintlify)
	@echo "$(MAGENTA)Starting Docs app (Mintlify on port 3003)...$(RESET)"
	@cd apps/docs && fnm exec --using=22 bun dev

dev\:extension: ## Run Chrome extension in dev mode (WXT, port 3010)
	@echo "$(MAGENTA)Starting Chrome extension (WXT dev, port 3010)...$(RESET)"
	@cd apps/extension && bun run dev

build: ## Build all apps
	@echo "$(BLUE)Building all apps...$(RESET)"
	@bun run build
	@echo "$(GREEN)Build complete!$(RESET)"

build\:web: ## Build web app only
	@echo "$(BLUE)Building web app...$(RESET)"
	@cd apps/web && bun run build
	@echo "$(GREEN)Web app built!$(RESET)"

build\:api: ## Build API only
	@echo "$(BLUE)Building API...$(RESET)"
	@cd apps/api && bun run build
	@echo "$(GREEN)API built!$(RESET)"

build\:share: ## Build Share URL shortener only
	@echo "$(BLUE)Building Share URL shortener...$(RESET)"
	@cd apps/share && bun run build
	@echo "$(GREEN)Share URL shortener built!$(RESET)"

build\:home: ## Build home app only
	@echo "$(BLUE)Building Home app...$(RESET)"
	@bun run turbo build --filter=home
	@echo "$(GREEN)Home app built!$(RESET)"

build\:ramp: ## Build Ramp app only
	@echo "$(BLUE)Building Ramp app...$(RESET)"
	@cd apps/ramp && bun run build
	@echo "$(GREEN)Ramp app built!$(RESET)"

build\:extension: ## Build Chrome extension
	@echo "$(BLUE)Building Chrome extension...$(RESET)"
	@cd apps/extension && bun run build
	@echo "$(GREEN)Chrome extension built!$(RESET)"

zip\:extension: ## Zip Chrome extension for distribution
	@echo "$(BLUE)Zipping Chrome extension...$(RESET)"
	@cd apps/extension && bun run zip
	@echo "$(GREEN)Chrome extension zipped!$(RESET)"

package\:zendesk: ## Package Zendesk manifest .zip (dev)
	@echo "$(BLUE)Packaging Zendesk manifest (dev)...$(RESET)"
	@cd packages/zendesk && bun run package:dev
	@echo "$(GREEN)Zendesk manifest packaged (dev)!$(RESET)"

package\:zendesk\:prod: ## Package Zendesk manifest .zip (prod)
	@echo "$(BLUE)Packaging Zendesk manifest (production)...$(RESET)"
	@cd packages/zendesk && bun run package
	@echo "$(GREEN)Zendesk manifest packaged (production)!$(RESET)"

preview\:home: ## Preview home production build (Cloudflare)
	@echo "$(MAGENTA)Previewing Home production build...$(RESET)"
	@bun run turbo build --filter=home && cd apps/home && bun run preview:cf

deploy\:home: ## Deploy home app (preview)
	@echo "$(BLUE)Deploying Home app (preview)...$(RESET)"
	@bun run turbo build --filter=home && cd apps/home && bun run deploy
	@echo "$(GREEN)Home app deployed (preview)!$(RESET)"

deploy\:home\:production: ## Deploy home app (production)
	@echo "$(RED)Deploying Home app (production)...$(RESET)"
	@echo "$(RED)WARNING: This will deploy to PRODUCTION!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@bun run turbo build --filter=home^... && cd apps/home && bun run build:production && bun run deploy:production
	@echo "$(GREEN)Home app deployed (production)!$(RESET)"

lint: ## Run linter
	@echo "$(YELLOW)Running linter...$(RESET)"
	@bun run lint
	@echo "$(GREEN)Linting complete!$(RESET)"

lint\:fix: ## Run linter and fix issues
	@echo "$(YELLOW)Running linter with auto-fix...$(RESET)"
	@bun run turbo lint -- --fix
	@echo "$(GREEN)Linting and fixes complete!$(RESET)"

format: ## Format all files
	@echo "$(YELLOW)Formatting code...$(RESET)"
	@bun run format
	@echo "$(GREEN)Formatting complete!$(RESET)"

format\:check: ## Check formatting
	@echo "$(YELLOW)Checking code formatting...$(RESET)"
	@bun run format:check

fmt: format ## Shortcut for format

fmt\:check: format\:check ## Shortcut for format:check

fmt\:fix: format\:fix ## Shortcut for format:fix

typecheck: ## Type check all packages
	@echo "$(BLUE)Running type check...$(RESET)"
	@bun run turbo typecheck
	@echo "$(GREEN)Type check complete!$(RESET)"

test: ## Run all tests
	@echo "$(CYAN)Running tests...$(RESET)"
	@bun run turbo test
	@echo "$(GREEN)Tests complete!$(RESET)"

test\:watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(RESET)"
	@bun run turbo test -- --watch

check: lint typecheck format\:check ## Run all checks
	@echo "$(GREEN)All checks passed!$(RESET)"

fix: lint\:fix format ## Fix all issues (lint + format)
	@echo "$(GREEN)All fixes applied!$(RESET)"

clean: ## Remove build outputs and caches
	@echo "$(YELLOW)Cleaning build outputs and caches...$(RESET)"
	@rm -rf .turbo
	@find . -name 'dist' -type d -prune -exec rm -rf '{}' +
	@find . -name '.next' -type d -prune -exec rm -rf '{}' +
	@find . -name '.astro' -type d -prune -exec rm -rf '{}' +
	@echo "$(GREEN)Clean complete!$(RESET)"

clean\:all: clean ## Remove deps, builds, and caches
	@echo "$(RED)Removing all dependencies...$(RESET)"
	@find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	@rm -f bun.lockb
	@echo "$(GREEN)Everything cleaned!$(RESET)"

clean\:deep: ## Remove all node_modules and reinstall
	@echo "$(YELLOW)Starting deep clean...$(RESET)"
	@echo "$(RED)Removing all node_modules directories...$(RESET)"
	@rm -rf node_modules
	@rm -rf apps/*/node_modules
	@rm -rf packages/*/node_modules
	@echo "$(BLUE)Reinstalling dependencies...$(RESET)"
	@bun install
	@echo "$(GREEN)Deep clean complete!$(RESET)"

reset: clean\:all install ## Clean and reinstall everything
	@echo "$(GREEN)Project reset complete!$(RESET)"

test\:api: ## Test API endpoints
	@echo "$(CYAN)Testing API endpoints...$(RESET)"
	@cd apps/api && ./test-api.sh

storybook\:recorder: ## Run Storybook for recorder app
	@echo "$(MAGENTA)Starting Storybook for recorder...$(RESET)"
	@cd apps/recorder && bun run storybook

storybook\:recorder\:build: ## Build Storybook for recorder app
	@echo "$(BLUE)Building Storybook for recorder...$(RESET)"
	@cd apps/recorder && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:postbridge: ## Run Storybook for postbridge package
	@echo "$(MAGENTA)Starting Storybook for postbridge...$(RESET)"
	@cd packages/postbridge && bun run storybook

storybook\:postbridge\:build: ## Build Storybook for postbridge package
	@echo "$(BLUE)Building Storybook for postbridge...$(RESET)"
	@cd packages/postbridge && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:blurr: ## Run Storybook for blurr package
	@echo "$(MAGENTA)Starting Storybook for blurr...$(RESET)"
	@cd packages/blurr && bun run storybook

storybook\:blurr\:build: ## Build Storybook for blurr package
	@echo "$(BLUE)Building Storybook for blurr...$(RESET)"
	@cd packages/blurr && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:sdk: ## Run Storybook for SDK package
	@echo "$(MAGENTA)Starting Storybook for SDK...$(RESET)"
	@cd packages/sdk && bun run storybook

storybook\:sdk\:build: ## Build Storybook for SDK package
	@echo "$(BLUE)Building Storybook for SDK...$(RESET)"
	@cd packages/sdk && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:embed: ## Run Storybook for embed package
	@echo "$(MAGENTA)Starting Storybook for embed...$(RESET)"
	@cd packages/embed && bun run storybook

storybook\:embed\:build: ## Build Storybook for embed package
	@echo "$(BLUE)Building Storybook for embed...$(RESET)"
	@cd packages/embed && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:logger: ## Run Storybook for logger package
	@echo "$(MAGENTA)Starting Storybook for logger...$(RESET)"
	@cd packages/logger && bun run storybook

storybook\:logger\:build: ## Build Storybook for logger package
	@echo "$(BLUE)Building Storybook for logger...$(RESET)"
	@cd packages/logger && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:dash: ## Run Storybook for dashboard (incl. Zendesk)
	@echo "$(MAGENTA)Starting Storybook for dashboard...$(RESET)"
	@cd apps/dash && bun run storybook

storybook\:dash\:build: ## Build Storybook for dashboard
	@echo "$(BLUE)Building Storybook for dashboard...$(RESET)"
	@cd apps/dash && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:extension: ## Run Storybook for Chrome extension (port 6012)
	@echo "$(MAGENTA)Starting Storybook for Chrome extension...$(RESET)"
	@cd apps/extension && bun run storybook

storybook\:extension\:build: ## Build Storybook for Chrome extension
	@echo "$(BLUE)Building Storybook for Chrome extension...$(RESET)"
	@cd apps/extension && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

# Assets commands
assets\:upload: ## Upload assets to R2 CDN (dev)
	@echo "$(BLUE)Uploading assets to R2 CDN (development)...$(RESET)"
	@if [ ! -f packages/storage/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/storage && bun run upload-assets --env=development
	@echo "$(GREEN)Assets uploaded!$(RESET)"

assets\:upload\:production: ## Upload assets to R2 CDN (production)
	@echo "$(RED)Uploading assets to R2 CDN (production)...$(RESET)"
	@echo "$(RED)WARNING: This will upload assets to PRODUCTION!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f packages/storage/.env.production ] && [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: .env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/storage && bun run upload-assets --env=production
	@echo "$(GREEN)Assets uploaded!$(RESET)"

assets\:upload\:dry-run: ## Preview what would be uploaded to R2 CDN (dev)
	@echo "$(BLUE)Previewing asset upload (development)...$(RESET)"
	@if [ ! -f packages/storage/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/storage && bun run upload-assets --env=development --dry-run

assets\:manifest: ## Generate asset manifest only (no upload)
	@echo "$(BLUE)Generating asset manifest...$(RESET)"
	@cd packages/storage && bun run assets:manifest
	@echo "$(GREEN)Manifest generated!$(RESET)"

assets\:validate: ## Validate manifest assets exist (local + remote dev)
	@echo "$(BLUE)Validating manifest assets...$(RESET)"
	@cd packages/storage && bun run assets:validate
	@echo "$(GREEN)Validation complete!$(RESET)"

assets\:validate\:local: ## Validate local asset files exist
	@echo "$(BLUE)Validating local assets...$(RESET)"
	@cd packages/storage && bun run assets:validate:local
	@echo "$(GREEN)Local validation complete!$(RESET)"

assets\:validate\:production: ## Validate assets exist on production CDN
	@echo "$(BLUE)Validating production CDN assets...$(RESET)"
	@cd packages/storage && bun run assets:validate:production
	@echo "$(GREEN)Production validation complete!$(RESET)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(RESET)"
	@bun update
	@echo "$(GREEN)Dependencies updated!$(RESET)"

env\:setup: ## Copy .env.example files to create .env.development files
	@echo "$(BLUE)Setting up environment files...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then cp apps/api/.env.example apps/api/.env.development && echo "$(GREEN)✓$(RESET) Created apps/api/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/api/.env.development already exists"; fi
	@if [ ! -f apps/dash/.env.development ]; then cp apps/dash/.env.example apps/dash/.env.development && echo "$(GREEN)✓$(RESET) Created apps/dash/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/dash/.env.development already exists"; fi
	@if [ ! -f apps/home/.env.development ]; then cp apps/home/.env.example apps/home/.env.development && echo "$(GREEN)✓$(RESET) Created apps/home/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/home/.env.development already exists"; fi
	@if [ ! -f apps/recorder/.env.development ]; then cp apps/recorder/.env.example apps/recorder/.env.development && echo "$(GREEN)✓$(RESET) Created apps/recorder/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/recorder/.env.development already exists"; fi
	@if [ ! -f apps/ramp/.env.development ]; then cp apps/ramp/.env.example apps/ramp/.env.development && echo "$(GREEN)✓$(RESET) Created apps/ramp/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/ramp/.env.development already exists"; fi
	@if [ ! -f apps/extension/.env.development ]; then cp apps/extension/.env.example apps/extension/.env.development && echo "$(GREEN)✓$(RESET) Created apps/extension/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/extension/.env.development already exists"; fi
	@if [ ! -f packages/storage/.env.development ]; then cp packages/storage/.env.example packages/storage/.env.development && echo "$(GREEN)✓$(RESET) Created packages/storage/.env.development"; else echo "$(YELLOW)⚠$(RESET) packages/storage/.env.development already exists"; fi
	@echo "$(GREEN)Environment files setup complete!$(RESET)"
	@echo "$(YELLOW)Remember to update the values in each .env.development file$(RESET)"

env\:check: ## Check if .env.development files exist
	@echo "$(BLUE)Checking environment files...$(RESET)"
	@if [ -f apps/api/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/api/.env.development exists"; else echo "$(RED)✗$(RESET) apps/api/.env.development missing"; fi
	@if [ -f apps/dash/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/dash/.env.development exists"; else echo "$(RED)✗$(RESET) apps/dash/.env.development missing"; fi
	@if [ -f apps/home/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/home/.env.development exists"; else echo "$(RED)✗$(RESET) apps/home/.env.development missing"; fi
	@if [ -f apps/recorder/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/recorder/.env.development exists"; else echo "$(RED)✗$(RESET) apps/recorder/.env.development missing"; fi
	@if [ -f apps/ramp/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/ramp/.env.development exists"; else echo "$(RED)✗$(RESET) apps/ramp/.env.development missing"; fi
	@if [ -f apps/extension/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/extension/.env.development exists"; else echo "$(RED)✗$(RESET) apps/extension/.env.development missing"; fi
	@if [ -f packages/storage/.env.development ]; then echo "$(GREEN)✓$(RESET) packages/storage/.env.development exists"; else echo "$(RED)✗$(RESET) packages/storage/.env.development missing (optional, falls back to apps/api)"; fi

# Database commands - Development
db\:generate: ## Generate Drizzle migrations (dev)
	@echo "$(BLUE)Generating Drizzle migrations (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate: ## Run database migrations (dev)
	@echo "$(BLUE)Running database migrations (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:reset: ## Drop all tables and re-run migrations (dev)
	@echo "$(RED)Resetting dev database (drop all tables + migrate)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:reset
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:migrate
	@echo "$(GREEN)Database reset and migrations complete!$(RESET)"

db\:push: ## Push schema directly to DB (dev)
	@echo "$(YELLOW)Pushing schema to database (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:push
	@echo "$(GREEN)Schema pushed!$(RESET)"

db\:studio: ## Open Drizzle Studio (dev)
	@echo "$(MAGENTA)Opening Drizzle Studio (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:studio

# Database commands - Production
db\:generate\:production: ## Generate Drizzle migrations (production)
	@echo "$(BLUE)Generating Drizzle migrations (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate\:production: ## Run database migrations (production)
	@echo "$(BLUE)Running database migrations (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:push\:production: ## Disabled - use db:migrate:production instead
	@echo "$(RED)db:push:production is disabled. Use 'make db:migrate:production' instead.$(RESET)"
	@echo "$(RED)Push bypasses migration tracking and can cause data loss.$(RESET)"
	@exit 1

db\:studio\:production: ## Open Drizzle Studio (production)
	@echo "$(MAGENTA)Opening Drizzle Studio (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:studio

# Ramp Database commands (local SQLite)
ramp\:db\:generate: ## Generate Ramp Drizzle migrations
	@echo "$(BLUE)Generating Ramp migrations...$(RESET)"
	@cd apps/ramp && bunx drizzle-kit generate
	@echo "$(GREEN)Ramp migrations generated!$(RESET)"

ramp\:db\:migrate: ## Run Ramp database migrations
	@echo "$(BLUE)Running Ramp migrations...$(RESET)"
	@cd apps/ramp && bun run db:migrate
	@echo "$(GREEN)Ramp migrations complete!$(RESET)"

ramp\:db\:push: ## Push Ramp schema directly to DB
	@echo "$(YELLOW)Pushing Ramp schema to database...$(RESET)"
	@cd apps/ramp && bunx drizzle-kit push
	@echo "$(GREEN)Ramp schema pushed!$(RESET)"

ramp\:db\:reset: ## Reset Ramp database (drop + migrate + seed)
	@echo "$(RED)Resetting Ramp database...$(RESET)"
	@cd apps/ramp && bun run db:reset
	@echo "$(GREEN)Ramp database reset!$(RESET)"

ramp\:db\:seed: ## Seed Ramp database
	@echo "$(BLUE)Seeding Ramp database...$(RESET)"
	@cd apps/ramp && bun run db:seed
	@echo "$(GREEN)Ramp database seeded!$(RESET)"

ramp\:db\:studio: ## Open Drizzle Studio for Ramp
	@echo "$(MAGENTA)Opening Drizzle Studio for Ramp...$(RESET)"
	@cd apps/ramp && bun run db:studio

# Pricing commands
SEED_SCRIPT := packages/payments/scripts/seed-product-metadata.ts
PLANS := essential starter scale-up enterprise

pricing\:sync: ## Sync plan metadata to DodoPayments (dev)
	@echo "$(BLUE)Syncing plan metadata → development...$(RESET)"
	@for plan in $(PLANS); do \
		bun run $(SEED_SCRIPT) --env development --plan plans/$${plan}_monthly.json && \
		bun run $(SEED_SCRIPT) --env development --plan plans/$${plan}_annual.json; \
	done
	@echo "$(GREEN)Plan metadata synced (development)!$(RESET)"

pricing\:sync\:production: ## Sync plan metadata to DodoPayments (production)
	@echo "$(RED)Syncing plan metadata → production...$(RESET)"
	@echo "$(RED)WARNING: This will update product metadata in PRODUCTION!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@for plan in $(PLANS); do \
		bun run $(SEED_SCRIPT) --env production --plan plans/$${plan}_monthly.json && \
		bun run $(SEED_SCRIPT) --env production --plan plans/$${plan}_annual.json; \
	done
	@echo "$(GREEN)Plan metadata synced (production)!$(RESET)"

# Inngest commands
inngest\:dev: ## Run Inngest dev server (localhost:8288)
	@echo "$(MAGENTA)Starting Inngest dev server...$(RESET)"
	@npx inngest-cli@latest dev

# Tunnel commands (Cloudflare Tunnel)
# Config file location
TUNNEL_CONFIG := .cloudflared/config.yml
TUNNEL_PID_FILE := .cloudflared/tunnel.pid
TUNNEL_LOG_FILE := .cloudflared/tunnel.log

tunnel\:start: ## Start Cloudflare tunnel (all services)
	@echo "$(MAGENTA)Starting Cloudflare tunnel...$(RESET)"
	@if ! command -v cloudflared >/dev/null 2>&1; then \
		echo "$(RED)Error: cloudflared is not installed$(RESET)"; \
		echo "$(YELLOW)Install with: brew install cloudflared$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -f $(TUNNEL_CONFIG) ]; then \
		echo "$(RED)Error: $(TUNNEL_CONFIG) not found$(RESET)"; \
		exit 1; \
	fi
	@# Check if tunnel is already running
	@if [ -f $(TUNNEL_PID_FILE) ] && kill -0 $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; then \
		echo "$(YELLOW)Tunnel is already running (PID: $$(cat $(TUNNEL_PID_FILE)))$(RESET)"; \
		exit 0; \
	fi
	@# Start cloudflared in background
	@cloudflared tunnel --config $(TUNNEL_CONFIG) run > $(TUNNEL_LOG_FILE) 2>&1 & echo $$! > $(TUNNEL_PID_FILE)
	@echo "$(YELLOW)Waiting for tunnel to establish...$(RESET)"
	@sleep 3
	@if kill -0 $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; then \
		echo ""; \
		echo "$(GREEN)Cloudflare tunnel started!$(RESET)"; \
		echo ""; \
		echo "$(CYAN)Tunnel URLs:$(RESET)"; \
		echo "$(WHITE)-------------------------------------------$(RESET)"; \
		echo "$(GREEN)API:$(RESET)        https://api-dev.userplane.io"; \
		echo "$(GREEN)Dash:$(RESET)       https://dash-dev.userplane.io"; \
		echo "$(GREEN)Home:$(RESET)       https://home-dev.userplane.io"; \
		echo "$(GREEN)Recorder:$(RESET)   https://recorder-dev.userplane.io"; \
		echo "$(GREEN)Ramp:$(RESET)       https://ramp-dev.userplane.io"; \
		echo "$(WHITE)-------------------------------------------$(RESET)"; \
		echo ""; \
		echo "$(YELLOW)Run 'make tunnel:stop' to stop the tunnel$(RESET)"; \
	else \
		echo "$(RED)Failed to start tunnel. Check $(TUNNEL_LOG_FILE) for details$(RESET)"; \
		exit 1; \
	fi

tunnel\:stop: ## Stop Cloudflare tunnel
	@echo "$(YELLOW)Stopping Cloudflare tunnel...$(RESET)"
	@if [ -f $(TUNNEL_PID_FILE) ]; then \
		pid=$$(cat $(TUNNEL_PID_FILE)); \
		if kill -0 "$$pid" 2>/dev/null; then \
			kill "$$pid" 2>/dev/null || true; \
			echo "$(GREEN)Stopped tunnel (PID: $$pid)$(RESET)"; \
		else \
			echo "$(YELLOW)Tunnel was not running$(RESET)"; \
		fi; \
		rm -f $(TUNNEL_PID_FILE); \
	else \
		echo "$(YELLOW)No tunnel PID file found$(RESET)"; \
	fi
	@# Also kill any orphaned cloudflared processes
	@pkill -f "cloudflared tunnel.*run" 2>/dev/null || true
	@echo "$(GREEN)Tunnel stopped!$(RESET)"

tunnel\:status: ## Show tunnel status and URLs
	@echo "$(CYAN)Cloudflare Tunnel Status$(RESET)"
	@echo "$(WHITE)-------------------------------------------$(RESET)"
	@if [ -f $(TUNNEL_PID_FILE) ] && kill -0 $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; then \
		echo "$(GREEN)Status:$(RESET)   Running (PID: $$(cat $(TUNNEL_PID_FILE)))"; \
	else \
		echo "$(RED)Status:$(RESET)   Not running"; \
	fi
	@echo "$(WHITE)-------------------------------------------$(RESET)"
	@echo "$(CYAN)Configured URLs:$(RESET)"
	@echo "$(GREEN)API:$(RESET)        https://api-dev.userplane.io"
	@echo "$(GREEN)Dash:$(RESET)       https://dash-dev.userplane.io"
	@echo "$(GREEN)Home:$(RESET)       https://home-dev.userplane.io"
	@echo "$(GREEN)Recorder:$(RESET)   https://recorder-dev.userplane.io"
	@echo "$(GREEN)Ramp:$(RESET)       https://ramp-dev.userplane.io"
	@echo "$(WHITE)-------------------------------------------$(RESET)"

# SDK Package commands
# Override these to point the SDK at different endpoints:
#   make sdk:build SDK_RECORDER_BASE_URL=https://recorder-dev.userplane.io SDK_VERIFICATION_BASE_URL=https://api-dev.userplane.io/api/v1
SDK_RECORDER_BASE_URL ?=
SDK_VERIFICATION_BASE_URL ?=

# Build env: forward URL overrides to Vite define (empty values use defaults in vite.config.ts)
SDK_BUILD_ENV := $(if $(SDK_RECORDER_BASE_URL),SDK_RECORDER_BASE_URL=$(SDK_RECORDER_BASE_URL)) \
                 $(if $(SDK_VERIFICATION_BASE_URL),SDK_VERIFICATION_BASE_URL=$(SDK_VERIFICATION_BASE_URL))

sdk\:build: ## Build SDK (standard dev build)
	@$(MAKE) metadata:build
	@echo "$(BLUE)Building SDK...$(RESET)"
	@cd packages/sdk && $(SDK_BUILD_ENV) bun run build
	@echo "$(GREEN)SDK built!$(RESET)"

sdk\:build\:npm: ## Build SDK (size-optimized for npm)
	@$(MAKE) metadata:build:npm
	@echo "$(BLUE)Building SDK (npm optimized)...$(RESET)"
	@cd packages/sdk && $(SDK_BUILD_ENV) bun run build:npm
	@echo "$(GREEN)SDK built (npm optimized)!$(RESET)"

sdk\:build\:cdn: ## Build SDK (size-optimized for CDN)
	@$(MAKE) metadata:build:cdn
	@echo "$(BLUE)Building SDK (CDN optimized)...$(RESET)"
	@cd packages/sdk && $(SDK_BUILD_ENV) bun run build:cdn
	@echo "$(GREEN)SDK built (CDN optimized)!$(RESET)"

sdk\:build\:npm\:obfuscate: ## Build SDK (obfuscated for npm)
	@$(MAKE) metadata:build:npm
	@echo "$(BLUE)Building SDK (npm obfuscated)...$(RESET)"
	@cd packages/sdk && $(SDK_BUILD_ENV) bun run build:npm:obfuscate
	@echo "$(GREEN)SDK built (npm obfuscated)!$(RESET)"

sdk\:build\:cdn\:obfuscate: ## Build SDK (obfuscated for CDN)
	@$(MAKE) metadata:build:cdn
	@echo "$(BLUE)Building SDK (CDN obfuscated)...$(RESET)"
	@cd packages/sdk && $(SDK_BUILD_ENV) bun run build:cdn:obfuscate
	@echo "$(GREEN)SDK built (CDN obfuscated)!$(RESET)"

# Metadata Package commands
metadata\:build: ## Build Metadata (standard dev build)
	@echo "$(BLUE)Building Metadata...$(RESET)"
	@cd packages/metadata && bun run build
	@echo "$(GREEN)Metadata built!$(RESET)"

metadata\:build\:npm: ## Build Metadata (size-optimized for npm)
	@echo "$(BLUE)Building Metadata (npm optimized)...$(RESET)"
	@cd packages/metadata && bun run build:npm
	@echo "$(GREEN)Metadata built (npm optimized)!$(RESET)"

metadata\:build\:cdn: ## Build Metadata (size-optimized for CDN)
	@echo "$(BLUE)Building Metadata (CDN optimized)...$(RESET)"
	@cd packages/metadata && bun run build:cdn
	@echo "$(GREEN)Metadata built (CDN optimized)!$(RESET)"

# Embed Package commands
# SDK endpoint URLs per environment (dev uses tunnel subdomains, production uses bare domains)
SDK_RECORDER_URL_DEV := https://recorder-dev.userplane.io
SDK_RECORDER_URL_PROD := https://recorder.userplane.io
SDK_VERIFICATION_URL_DEV := https://api-dev.userplane.io/api/v1
SDK_VERIFICATION_URL_PROD := https://api.userplane.io/api/v1

embed\:build: ## Build Embed (standard dev build)
	@$(MAKE) sdk:build SDK_RECORDER_BASE_URL=$(SDK_RECORDER_URL_DEV) SDK_VERIFICATION_BASE_URL=$(SDK_VERIFICATION_URL_DEV)
	@echo "$(BLUE)Building Embed...$(RESET)"
	@cd packages/embed && bun run build
	@echo "$(GREEN)Embed built!$(RESET)"

# Helper function to extract CDN_DOMAIN from .env file
# Usage: $(call get_cdn_domain,environment)
define get_cdn_domain
$(shell \
	if [ -f packages/embed/.env.$(1) ]; then \
		grep '^CDN_DOMAIN' packages/embed/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	elif [ -f apps/api/.env.$(1) ]; then \
		grep '^CDN_DOMAIN' apps/api/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	fi \
)
endef

# Helper function to extract R2_CDN_PREFIX from .env file
# Usage: $(call get_cdn_prefix,environment)
define get_cdn_prefix
$(shell \
	if [ -f packages/embed/.env.$(1) ]; then \
		grep '^R2_CDN_PREFIX' packages/embed/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	elif [ -f apps/api/.env.$(1) ]; then \
		grep '^R2_CDN_PREFIX' apps/api/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	fi \
)
endef

embed\:build\:cdn: embed\:build\:cdn\:dev ## Build Embed for CDN (alias for embed:build:cdn:dev)

embed\:build\:cdn\:dev: ## Build Embed for CDN with dev CDN configuration
	@if [ ! -f packages/embed/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@$(MAKE) sdk:build:cdn SDK_RECORDER_BASE_URL=$(SDK_RECORDER_URL_DEV) SDK_VERIFICATION_BASE_URL=$(SDK_VERIFICATION_URL_DEV)
	@echo "$(BLUE)Building Embed (CDN) for development...$(RESET)"
	$(eval CDN_DOMAIN_VAL := $(call get_cdn_domain,development))
	$(eval CDN_PREFIX_VAL := $(call get_cdn_prefix,development))
	@if [ -z "$(CDN_DOMAIN_VAL)" ]; then \
		echo "$(RED)Error: CDN_DOMAIN not found in .env.development$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Using CDN URL: $(CDN_DOMAIN_VAL)/$(or $(CDN_PREFIX_VAL),embed)$(RESET)"
	@cd packages/embed && CDN_DOMAIN="$(CDN_DOMAIN_VAL)" R2_CDN_PREFIX="$(or $(CDN_PREFIX_VAL),embed)" bun run build:cdn
	@echo "$(GREEN)Embed built (CDN) for development!$(RESET)"

embed\:build\:cdn\:production: ## Build Embed for CDN with production CDN configuration
	@if [ ! -f packages/embed/.env.production ] && [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: .env.production not found$(RESET)"; \
		exit 1; \
	fi
	@$(MAKE) sdk:build:cdn SDK_RECORDER_BASE_URL=$(SDK_RECORDER_URL_PROD) SDK_VERIFICATION_BASE_URL=$(SDK_VERIFICATION_URL_PROD)
	@echo "$(BLUE)Building Embed (CDN) for production...$(RESET)"
	$(eval CDN_DOMAIN_VAL := $(call get_cdn_domain,production))
	$(eval CDN_PREFIX_VAL := $(call get_cdn_prefix,production))
	@if [ -z "$(CDN_DOMAIN_VAL)" ]; then \
		echo "$(RED)Error: CDN_DOMAIN not found in .env.production$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Using CDN URL: $(CDN_DOMAIN_VAL)/$(or $(CDN_PREFIX_VAL),embed)$(RESET)"
	@cd packages/embed && CDN_DOMAIN="$(CDN_DOMAIN_VAL)" R2_CDN_PREFIX="$(or $(CDN_PREFIX_VAL),embed)" bun run build:cdn
	@echo "$(GREEN)Embed built (CDN) for production!$(RESET)"

embed\:upload: ## Upload Embed to R2 CDN (dev)
	@echo "$(BLUE)Uploading Embed to R2 CDN (development)...$(RESET)"
	@if [ ! -f packages/embed/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/embed && bun run upload:cdn --env=development
	@echo "$(GREEN)Embed uploaded!$(RESET)"

embed\:upload\:production: ## Upload Embed to R2 CDN (production)
	@echo "$(RED)Uploading Embed to R2 CDN (production)...$(RESET)"
	@echo "$(RED)WARNING: This will upload Embed to PRODUCTION CDN!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f packages/embed/.env.production ] && [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: .env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/embed && bun run upload:cdn --env=production
	@echo "$(GREEN)Embed uploaded!$(RESET)"

embed\:upload\:dry-run: ## Preview Embed upload (no changes)
	@echo "$(BLUE)Previewing Embed upload (development)...$(RESET)"
	@if [ ! -f packages/embed/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/embed && bun run upload:cdn --env=development --dry-run

embed\:deploy: ## Build and deploy Embed (dev)
	@$(MAKE) embed:build:cdn:dev
	@echo "$(BLUE)Deploying Embed (development)...$(RESET)"
	@cd packages/embed && bun run upload:cdn --env=development
	@echo "$(GREEN)Embed deployed!$(RESET)"

embed\:deploy\:production: ## Build and deploy Embed (production)
	@$(MAKE) embed:build:cdn:production
	@echo "$(RED)Deploying Embed (production)...$(RESET)"
	@echo "$(RED)WARNING: This will deploy Embed to PRODUCTION CDN!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd packages/embed && bun run upload:cdn --env=production
	@echo "$(GREEN)Embed deployed!$(RESET)"

i: install ## Shortcut for install
d: dev ## Shortcut for dev
b: build ## Shortcut for build
l: lint ## Shortcut for lint
f: format ## Shortcut for format
t: test ## Shortcut for test
c: check ## Shortcut for check

