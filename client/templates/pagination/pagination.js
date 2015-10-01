//var currentPageTracker = new Tracker.Dependency;

Template.pagination.helpers({
	'pageNumber' : function(paginationData) {
		//currentPageTracker.depend()
		//pages from the dev's perspective are 0-indexed
		var pageArray = [];

		try {
			var paginationId = paginationData.identifier;
			var totalResults = paginationData.totalResults;
			var resultsPerPage = paginationData.resultsPerPage;
			var pageNumbersDisplayed = paginationData.pageNumbersDisplayed;

			var currentPage;
			if (Session.get(paginationId + '_current'))
				currentPage = Session.get(paginationId + '_current');

			else currentPage = 0;

			var pageCount = totalResults / resultsPerPage;

			var firstPageShown = Math.floor((currentPage / pageNumbersDisplayed)) * pageNumbersDisplayed;
			var lastPageShown = firstPageShown + pageNumbersDisplayed - 1;

			pageArray.push({
				'status' : (firstPageShown >= pageNumbersDisplayed) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : 0,
				'text' : '<<'
			});

			pageArray.push({
				'status' : (firstPageShown >= pageNumbersDisplayed) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : firstPageShown - 1,
				'text' : '<'
			});

			for (var i = 0; i < pageNumbersDisplayed; i++) {
				var pageStatus; 

				if (currentPage == firstPageShown + i)
					pageStatus = "page-number-current";

				else if (firstPageShown + i >= pageCount) 
					pageStatus = "page-number-disabled";

				else pageStatus = "page-number-enabled";


				pageArray.push({
					'status' : pageStatus,
					'pageNum' : firstPageShown + i,
					'text' : firstPageShown + i + 1
				});
			}

			pageArray.push({
				'status' : (lastPageShown < pageCount) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : lastPageShown + 1,
				'text' : '>'
			});

			pageArray.push({
				'status' : (lastPageShown < pageCount) ? 'page-number-enabled blue' : 'page-number-disabled',
				'pageNum' : pageCount - 1,
				'text' : '>>'
			});
		}

		catch(error) {
			console.log(error.message);
		}

		return pageArray;
	}
})

Template.pagination.events({
	'click .page-number-enabled' : function(element) {
		var paginationId = $('.template-pagination').data('pagination-id');
        var pageNumber = element.target.dataset.page_number;
	    Session.set(paginationId + '_current', pageNumber);
    },
})