$(document).ready(function () {
    var cityListKey = "city-list";
    var lastSearchKey = "last-search";
    
    var apiKey = "dda71347a8386c3ce49aac0a000ae53e"; 
    var uvQueryURL = "https://api.openweathermap.org/data/2.5/uvi?appid=" + apiKey;
    var cityQueryURL = "https://api.openweathermap.org/data/2.5/weather?units=imperial&appid=" + apiKey;     // get temp in F by using units=imperial
    var fiveDayQueryURL = "https://api.openweathermap.org/data/2.5/forecast?units=imperial&appid=" + apiKey; // get temp in F by using units=imperial

    function setTime() {
        // initial setting of time when page loads up
        var rightNow = moment();
        $("#time-stamp").text(rightNow.format("ddd, h:mmA"));

      
        var timerInterval = setInterval(function () {
            rightNow = moment();
            $("#time-stamp").text(rightNow.format("ddd, h:mmA"));
        }, 60000);
    }

    function refreshCityList() {
        
        var cityList = JSON.parse(localStorage.getItem(cityListKey)) || [];

        
        var cityListEl = $("#city-list");
        cityListEl.empty();

        for (let i = 0; i < cityList.length; i++) {
            
            const city = cityList[i];

            
            var newCityEl = $("<a>");
            newCityEl.attr("href", "#");
            newCityEl.addClass("list-group-item list-group-item-action searched-city");
            newCityEl.text(city);

           
            cityListEl.prepend(newCityEl);
        }
    }

    function initializeLastSearched() {
        var lastSearch = localStorage.getItem(lastSearchKey);
        if(lastSearch !== null){
            makeAPICalls(lastSearch);
        }
    }

    function makeAPICalls(cityName) {
        // First API call...Use city as parameter to API search for most of basic info:
        $.ajax({
            url: cityQueryURL + "&q=" + cityName,
            method: "GET"
        }).then(function (conditionsResponse) {
            displayCurrentConditions(conditionsResponse);

            // Second API call...Use long/lat of response to above API search for uv index
            $.ajax({
                url: uvQueryURL + "&lat=" + conditionsResponse.coord.lat + "&lon=" + conditionsResponse.coord.lon,
                method: "GET"
            }).then(function (uvResponse) {
                displayUVIndex(uvResponse);

                // Third API call...Use city as parameter to API search for 5 day forecast:
                $.ajax({
                    url: fiveDayQueryURL + "&q=" + cityName,
                    method: "GET"
                }).then(function (fiveDayResponse) {
                    display5DayForecast(fiveDayResponse);
                })
            })

            
            saveSearchParameter(conditionsResponse.name);
        });

    }

    function displayCurrentConditions(response) {
       
        $("#time-stamp").removeAttr("hidden");

        //     display city name, current condition and appropriate icon
        var iconUrl = "https://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png"
        $("#db-icon").attr("src", iconUrl);
        $("#db-current").text("Current: " + response.weather[0].main);
        $("#db-location").text(response.name);

        //     pull temp, humidity and wind speed for display
        $("#db-temp").text("Temp: " + response.main.temp + " F");
        $("#db-humidity").text("Humidity: " + response.main.humidity + "%");
        $("#db-wind").text("Wind: " + response.wind.speed + " knots");
    }

    function displayUVIndex(response) {
       
        $("#db-uv-header").removeAttr("hidden");
        var uvIndexNumeric = parseFloat(response.value);
        $("#db-uv").text(" " + uvIndexNumeric);

       
        $("#db-uv").removeClass("uv012 uv34 uv56 uv789 uv10plus");
        if (uvIndexNumeric >= 10.00) {
            $("#db-uv").addClass("uv10plus");
        } else if (uvIndexNumeric >= 7.00) {
            $("#db-uv").addClass("uv789");
        } else if (uvIndexNumeric >= 5.00) {
            $("#db-uv").addClass("uv56");
        } else if (uvIndexNumeric >= 3.00) {
            $("#db-uv").addClass("uv34");
        } else {
            $("#db-uv").addClass("uv012");
        }
    }

    function display5DayForecast(response) {
        
        $("#five-day-header").removeAttr("hidden");
        $(".card-group").removeAttr("hidden");

        
        
        var startIndex = 0;
        var responseArray = response.list;
        for (let i = 0; i < responseArray.length; i++) {
            var dateString = responseArray[i].dt_txt;
            var dateObj = new Date(dateString);
            var momentObj = moment(dateObj);
            if(startIndex === 0 && momentObj.hour() === 12 ){
                startIndex = i;
            }
        }

        // loop through every 8th response, beginning with startIndex
        var cardCounter = 1;
        for (let i = startIndex; i < responseArray.length; i += 8) {
            
            // create element of 5 Day Forecast
            var dateString = responseArray[i].dt_txt;
            var dateObj = new Date(dateString);
            var momentObj = moment(dateObj);
            var momentString = momentObj.format("ddd, h:mmA");
            var newDivHeaderEl = $("<div>").addClass("card-header").text(momentString);
            
            var newDivBodyEl = $("<div>").addClass("card-body");
            var newH5TitleEl = $("<h5>").addClass("card-title").text("Temp: " + responseArray[i].main.temp + " F");
            var newPTextEl = $("<p>").addClass("card-text").text("Humidity: " + responseArray[i].main.humidity + "%");
            newDivBodyEl.append(newH5TitleEl);
            newDivBodyEl.append(newPTextEl);
            
            var iconUrl = "https://openweathermap.org/img/wn/" + responseArray[i].weather[0].icon + "@2x.png"
            var newImgEl = $("<img>").attr("src", iconUrl);
            
            var newDivFooterEl = $("<div>").addClass("card-header");
            var newConditionEl = $("<large>").text(responseArray[i].weather[0].main);
            newDivFooterEl.append(newConditionEl);
            
            var id = "#5day-" + cardCounter; 
            $(id).empty();
            $(id).append(newDivHeaderEl);
            $(id).append(newDivBodyEl);
            $(id).append(newImgEl);
            $(id).append(newDivFooterEl);
            $(id).removeAttr("hidden");
            cardCounter++;
        }
    }

    function saveSearchParameter(cityName) {
      
        localStorage.removeItem(lastSearchKey);
        localStorage.setItem(lastSearchKey, cityName);

       
        var cityList = JSON.parse(localStorage.getItem(cityListKey)) || [];
        var index = cityList.indexOf(cityName);
        if(index >= 0) {
            cityList.splice(index, 1);
            
        }

       
        
        cityList.push(cityName);
        localStorage.setItem(cityListKey, JSON.stringify(cityList));
        refreshCityList();
    }

    $("#submit-btn").on("click", function () {
        
        var cityName = $("#city-input").val();
        if (cityName === "") {
            
            return;
        }
        $("#city-input").val("");
        makeAPICalls(cityName);
    })
    // OR
    $("#city-list").on("click", "a.searched-city", function () {
        
        var cityName = $(this).text();
        makeAPICalls(cityName);
    })

    $("#clear-btn").on("click", function () {
        
        localStorage.removeItem(cityListKey);
        refreshCityList();
        
    })

    setTime();
    refreshCityList();
    initializeLastSearched();
})