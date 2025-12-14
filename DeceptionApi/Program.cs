using Microsoft.AspNetCore.SignalR;
using DeceptionApi.Hubs;
using DeceptionApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<GameService>();
builder.Services.AddSingleton<RoomService>();
builder.Services.AddControllers();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapHub<GameHub>("/gamehub");

app.MapControllers();

app.Run();
